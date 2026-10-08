import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

export const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);

// ===== EXAM MANAGEMENT =====

adminRouter.get('/exams', async (_req, res: Response): Promise<void> => {
  try {
    const exams = await prisma.exam.findMany({
      include: { sections: { include: { questions: true } }, config: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

adminRouter.post('/exams', async (req, res: Response): Promise<void> => {
  try {
    const { title, description, examType, mode, duration, isPublished, isDemo, year, config, sections } = req.body;

    const exam = await prisma.exam.create({
      data: {
        title, description, examType, mode,
        duration: parseInt(duration),
        isPublished: isPublished ?? false,
        isDemo: isDemo ?? false,
        year: year ? parseInt(year) : null,
        config: config ? {
          create: {
            correctMarks: config.correctMarks ?? 4,
            incorrectMarks: config.incorrectMarks ?? -1,
            unansweredMarks: config.unansweredMarks ?? 0,
          },
        } : undefined,
        sections: sections ? {
          create: sections.map((s: any, i: number) => ({
            name: s.name,
            subject: s.subject,
            questionCount: s.questionCount ?? 0,
            order: i,
            correctMarks: s.correctMarks,
            incorrectMarks: s.incorrectMarks,
          })),
        } : undefined,
      },
      include: { sections: true, config: true },
    });

    res.status(201).json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

adminRouter.put('/exams/:id', async (req, res: Response): Promise<void> => {
  try {
    const { title, description, isPublished, duration, year } = req.body;
    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: { title, description, isPublished, duration: parseInt(duration), year },
    });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update exam' });
  }
});

adminRouter.delete('/exams/:id', async (req, res: Response): Promise<void> => {
  try {
    await prisma.exam.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

// Add question to exam section
adminRouter.post('/exams/:examId/sections/:sectionId/questions', async (req, res: Response): Promise<void> => {
  try {
    const { questionId, order } = req.body;
    const eq = await prisma.examQuestion.create({
      data: {
        examId: req.params.examId,
        sectionId: req.params.sectionId,
        questionId,
        order: order ?? 0,
      },
    });
    // Update section question count
    await prisma.examSection.update({
      where: { id: req.params.sectionId },
      data: { questionCount: { increment: 1 } },
    });
    // Update exam total marks
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (question) {
      await prisma.exam.update({
        where: { id: req.params.examId },
        data: { totalMarks: { increment: question.correctMarks } },
      });
    }
    res.status(201).json(eq);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add question to exam' });
  }
});

// ===== QUESTION MANAGEMENT =====

adminRouter.post('/questions', async (req, res: Response): Promise<void> => {
  try {
    const {
      subject, chapter, topic, questionType, questionText, difficulty,
      correctMarks, negativeMarks, source, year, shift, isPYQ,
      solution, explanation, formulaUsed, tags, imageUrl, examType, options
    } = req.body;

    const question = await prisma.question.create({
      data: {
        subject, chapter, topic, questionType, questionText, difficulty: difficulty ?? 'MEDIUM',
        correctMarks: correctMarks ?? 4, negativeMarks: negativeMarks ?? -1,
        source, year, shift, isPYQ: isPYQ ?? false,
        solution, explanation, formulaUsed,
        tags: tags ? JSON.stringify(tags) : null,
        imageUrl, examType,
        options: {
          create: options?.map((o: any, i: number) => ({
            optionLabel: o.label || String.fromCharCode(65 + i),
            optionText: o.text,
            isCorrect: o.isCorrect ?? false,
            order: i,
          })) || [],
        },
      },
      include: { options: { orderBy: { order: 'asc' } } },
    });

    res.status(201).json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

adminRouter.put('/questions/:id', async (req, res: Response): Promise<void> => {
  try {
    const { questionText, solution, explanation, difficulty, options } = req.body;

    // Update options if provided
    if (options) {
      await prisma.questionOption.deleteMany({ where: { questionId: req.params.id } });
      await prisma.questionOption.createMany({
        data: options.map((o: any, i: number) => ({
          questionId: req.params.id,
          optionLabel: o.label || String.fromCharCode(65 + i),
          optionText: o.text,
          isCorrect: o.isCorrect ?? false,
          order: i,
        })),
      });
    }

    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: { questionText, solution, explanation, difficulty },
      include: { options: { orderBy: { order: 'asc' } } },
    });

    res.json(question);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

adminRouter.delete('/questions/:id', async (req, res: Response): Promise<void> => {
  try {
    await prisma.question.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Bulk import questions
adminRouter.post('/questions/import', async (req, res: Response): Promise<void> => {
  try {
    const { questions } = req.body;
    const created = [];

    for (const q of questions) {
      const question = await prisma.question.create({
        data: {
          subject: q.subject,
          chapter: q.chapter,
          topic: q.topic,
          questionType: q.questionType || 'MCQ_SINGLE',
          questionText: q.questionText,
          difficulty: q.difficulty || 'MEDIUM',
          correctMarks: q.marks || 4,
          negativeMarks: q.negativeMarks || -1,
          isPYQ: q.isPYQ || false,
          source: q.source || 'PRACTICE',
          solution: q.solution,
          explanation: q.explanation,
          options: {
            create: (q.options || []).map((o: any, i: number) => ({
              optionLabel: o.label || String.fromCharCode(65 + i),
              optionText: o.text || o,
              isCorrect: o.isCorrect || (o.label === q.correctAnswer) || false,
              order: i,
            })),
          },
        },
      });
      created.push(question);
    }

    res.status(201).json({ created: created.length, questions: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Import failed' });
  }
});

// Get all users
adminRouter.get('/users', async (_req, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
