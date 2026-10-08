import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { calculateScore } from '../services/scoringEngine';

export const attemptRouter = Router();

// Start or resume an attempt
attemptRouter.post('/start', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { examId } = req.body;
    const userId = req.user!.id;

    // Check for existing in-progress attempt
    const existing = await prisma.examAttempt.findFirst({
      where: { userId, examId, status: 'IN_PROGRESS' },
      include: {
        answers: true,
        exam: {
          include: {
            sections: {
              include: {
                questions: {
                  include: {
                    question: { include: { options: { orderBy: { order: 'asc' } } } },
                  },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
            config: true,
          },
        },
      },
    });

    if (existing) {
      // Calculate elapsed time
      const elapsed = Math.floor((Date.now() - existing.startTime.getTime()) / 1000);
      const timeAllowed = existing.timeAllowed;
      const timeRemaining = Math.max(0, timeAllowed - elapsed);

      // Auto-submit if time is up
      if (timeRemaining === 0) {
        await autoSubmit(existing.id);
        res.status(409).json({ error: 'Exam time has expired', attemptId: existing.id, autoSubmitted: true });
        return;
      }

      res.json({ attempt: existing, timeRemaining, resumed: true });
      return;
    }

    // Fetch exam
    const exam = await prisma.exam.findUnique({
      where: { id: examId, isPublished: true },
      include: {
        sections: {
          include: {
            questions: {
              include: {
                question: { include: { options: { orderBy: { order: 'asc' } } } },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        config: true,
      },
    });

    if (!exam) {
      res.status(404).json({ error: 'Exam not found or not published' });
      return;
    }

    const timeAllowed = exam.duration * 60; // convert to seconds

    // Count existing attempts by user for this exam
    const attemptNumber = await prisma.examAttempt.count({ where: { userId, examId } }) + 1;

    // Create attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        userId,
        examId,
        timeAllowed,
        attemptNumber,
        currentSubject: exam.sections[0]?.subject || 'PHYSICS',
      },
      include: {
        exam: {
          include: {
            sections: {
              include: {
                questions: {
                  include: {
                    question: { include: { options: { orderBy: { order: 'asc' } } } },
                  },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
            config: true,
          },
        },
      },
    });

    // Initialize answer records for all questions
    const allExamQuestions = attempt.exam.sections.flatMap((s) =>
      s.questions.map((eq, idx) => ({
        attemptId: attempt.id,
        questionId: eq.questionId,
        questionIndex: idx,
        subject: eq.section?.subject || s.subject,
        status: 'NOT_VISITED' as const,
      }))
    );

    // Build flat list with correct index across sections
    let globalIndex = 0;
    const answerData = attempt.exam.sections.flatMap((s) =>
      s.questions.map((eq) => ({
        attemptId: attempt.id,
        questionId: eq.questionId,
        questionIndex: globalIndex++,
        subject: s.subject,
        status: 'NOT_VISITED' as const,
      }))
    );

    await prisma.attemptAnswer.createMany({ data: answerData });

    // Log event
    await prisma.attemptEvent.create({
      data: {
        attemptId: attempt.id,
        eventType: 'EXAM_STARTED',
        payload: JSON.stringify({ examId, userId }),
      },
    });

    res.status(201).json({ attempt, timeRemaining: timeAllowed, resumed: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start exam' });
  }
});

// Get attempt details
attemptRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: req.params.id },
      include: {
        answers: {
          include: {
            question: {
              include: { options: { orderBy: { order: 'asc' } } },
            },
          },
        },
        exam: {
          include: {
            sections: {
              include: {
                questions: {
                  include: {
                    question: { include: { options: { orderBy: { order: 'asc' } } } },
                  },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
            config: true,
          },
        },
      },
    });

    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found' });
      return;
    }

    if (attempt.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Calculate time remaining
    const elapsed = Math.floor((Date.now() - attempt.startTime.getTime()) / 1000);
    const timeRemaining = Math.max(0, attempt.timeAllowed - elapsed);

    res.json({ attempt, timeRemaining });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attempt' });
  }
});

// Save answer (called on every interaction)
attemptRouter.post('/:id/answer', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questionId, selectedOptions, numericalAnswer, status, timeSpent } = req.body;

    const attempt = await prisma.examAttempt.findUnique({ where: { id: req.params.id } });
    if (!attempt || attempt.userId !== req.user!.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    if (attempt.status !== 'IN_PROGRESS') {
      res.status(400).json({ error: 'Attempt already submitted' });
      return;
    }

    // Check time validity
    const elapsed = Math.floor((Date.now() - attempt.startTime.getTime()) / 1000);
    if (elapsed > attempt.timeAllowed + 30) { // 30s grace
      await autoSubmit(attempt.id);
      res.status(409).json({ error: 'Time expired', autoSubmitted: true });
      return;
    }

    const existingAnswer = await prisma.attemptAnswer.findUnique({
      where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
    });

    const now = new Date();
    const updatedAnswer = await prisma.attemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
      update: {
        selectedOptions: selectedOptions ? JSON.stringify(selectedOptions) : null,
        numericalAnswer: numericalAnswer !== undefined ? parseFloat(numericalAnswer) : undefined,
        status,
        timeSpent: (existingAnswer?.timeSpent || 0) + (timeSpent || 0),
        visitCount: { increment: 1 },
        lastAnsweredAt: now,
      },
      create: {
        attemptId: attempt.id,
        questionId,
        questionIndex: 0,
        subject: 'PHYSICS',
        selectedOptions: selectedOptions ? JSON.stringify(selectedOptions) : null,
        numericalAnswer: numericalAnswer !== undefined ? parseFloat(numericalAnswer) : undefined,
        status,
        timeSpent: timeSpent || 0,
        visitCount: 1,
        firstVisitAt: now,
        lastAnsweredAt: now,
      },
    });

    // Update current question/subject state
    await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        currentQuestion: req.body.currentQuestion ?? attempt.currentQuestion,
        currentSubject: req.body.currentSubject ?? attempt.currentSubject,
      },
    });

    // Log event
    await prisma.attemptEvent.create({
      data: {
        attemptId: attempt.id,
        eventType: status === 'ANSWERED' ? 'ANSWER_SELECTED'
          : status === 'NOT_ANSWERED' ? 'ANSWER_CLEARED'
          : status === 'MARKED_FOR_REVIEW' ? 'QUESTION_MARKED'
          : 'QUESTION_NAVIGATED',
        payload: JSON.stringify({ questionId, status }),
      },
    });

    res.json({ answer: updatedAnswer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save answer' });
  }
});

// Bulk sync answers (for recovery/persistence)
attemptRouter.post('/:id/sync', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { answers, currentQuestion, currentSubject } = req.body;
    const attempt = await prisma.examAttempt.findUnique({ where: { id: req.params.id } });

    if (!attempt || attempt.userId !== req.user!.id || attempt.status !== 'IN_PROGRESS') {
      res.status(403).json({ error: 'Access denied or attempt not in progress' });
      return;
    }

    // Upsert all answers
    for (const ans of answers) {
      await prisma.attemptAnswer.upsert({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: ans.questionId } },
        update: {
          selectedOptions: ans.selectedOptions ? JSON.stringify(ans.selectedOptions) : null,
          numericalAnswer: ans.numericalAnswer,
          status: ans.status,
          timeSpent: ans.timeSpent || 0,
        },
        create: {
          attemptId: attempt.id,
          questionId: ans.questionId,
          questionIndex: ans.questionIndex || 0,
          subject: ans.subject || 'PHYSICS',
          selectedOptions: ans.selectedOptions ? JSON.stringify(ans.selectedOptions) : null,
          numericalAnswer: ans.numericalAnswer,
          status: ans.status || 'NOT_VISITED',
          timeSpent: ans.timeSpent || 0,
        },
      });
    }

    await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: { currentQuestion, currentSubject },
    });

    res.json({ synced: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Submit attempt
attemptRouter.post('/:id/submit', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: req.params.id },
      include: {
        answers: { include: { question: { include: { options: true } } } },
        exam: { include: { config: true, sections: { include: { questions: true } } } },
      },
    });

    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found' });
      return;
    }

    if (attempt.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (attempt.status !== 'IN_PROGRESS') {
      res.status(400).json({ error: 'Attempt already submitted' });
      return;
    }

    const result = await calculateScore(attempt);

    const now = new Date();
    const timeUsed = Math.floor((now.getTime() - attempt.startTime.getTime()) / 1000);

    // Update attempt
    const updated = await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        status: req.body.autoSubmit ? 'AUTO_SUBMITTED' : 'SUBMITTED',
        submittedAt: now,
        timeUsed: Math.min(timeUsed, attempt.timeAllowed),
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        correctCount: result.correctCount,
        incorrectCount: result.incorrectCount,
        unansweredCount: result.unansweredCount,
      },
    });

    // Update individual answer marks
    for (const ansResult of result.answerResults) {
      await prisma.attemptAnswer.update({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: ansResult.questionId } },
        data: { isCorrect: ansResult.isCorrect, marksAwarded: ansResult.marksAwarded },
      });
    }

    // Save performance snapshot
    await prisma.performanceSnapshot.create({
      data: {
        userId: attempt.userId,
        attemptId: attempt.id,
        examTitle: attempt.exam.title,
        examType: attempt.exam.examType,
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.maxScore > 0 ? (result.totalScore / result.maxScore) * 100 : 0,
        accuracy: result.correctCount + result.incorrectCount > 0
          ? (result.correctCount / (result.correctCount + result.incorrectCount)) * 100 : 0,
        attemptRate: result.totalQuestions > 0
          ? ((result.correctCount + result.incorrectCount) / result.totalQuestions) * 100 : 0,
        correctCount: result.correctCount,
        incorrectCount: result.incorrectCount,
        unansweredCount: result.unansweredCount,
        timeUsed: Math.min(timeUsed, attempt.timeAllowed),
        physicsScore: result.subjectScores.PHYSICS?.score,
        chemistryScore: result.subjectScores.CHEMISTRY?.score,
        mathScore: result.subjectScores.MATHEMATICS?.score,
      },
    });

    // Log event
    await prisma.attemptEvent.create({
      data: {
        attemptId: attempt.id,
        eventType: req.body.autoSubmit ? 'EXAM_AUTO_SUBMITTED' : 'EXAM_SUBMITTED',
        payload: JSON.stringify({ totalScore: result.totalScore }),
      },
    });

    res.json({ attempt: updated, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Submission failed' });
  }
});

// Get attempt result
attemptRouter.get('/:id/result', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: req.params.id },
      include: {
        answers: {
          include: {
            question: { include: { options: { orderBy: { order: 'asc' } } } },
          },
          orderBy: { questionIndex: 'asc' },
        },
        exam: {
          include: {
            config: true,
            sections: {
              include: {
                questions: {
                  include: {
                    question: { include: { options: { orderBy: { order: 'asc' } } } },
                  },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        events: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found' });
      return;
    }

    if (attempt.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (attempt.status === 'IN_PROGRESS') {
      res.status(400).json({ error: 'Attempt not yet submitted' });
      return;
    }

    res.json(attempt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

// Get user attempts
attemptRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attempts = await prisma.examAttempt.findMany({
      where: { userId: req.user!.id },
      include: { exam: { select: { title: true, examType: true, duration: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

// Internal auto-submit function
async function autoSubmit(attemptId: string): Promise<void> {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: { include: { question: { include: { options: true } } } },
      exam: { include: { config: true, sections: { include: { questions: true } } } },
    },
  });
  if (!attempt || attempt.status !== 'IN_PROGRESS') return;

  const result = await calculateScore(attempt);
  const now = new Date();
  const timeUsed = Math.floor((now.getTime() - attempt.startTime.getTime()) / 1000);

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      status: 'AUTO_SUBMITTED',
      submittedAt: now,
      timeUsed: Math.min(timeUsed, attempt.timeAllowed),
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      correctCount: result.correctCount,
      incorrectCount: result.incorrectCount,
      unansweredCount: result.unansweredCount,
    },
  });

  for (const ans of result.answerResults) {
    await prisma.attemptAnswer.update({
      where: { attemptId_questionId: { attemptId, questionId: ans.questionId } },
      data: { isCorrect: ans.isCorrect, marksAwarded: ans.marksAwarded },
    });
  }
}
