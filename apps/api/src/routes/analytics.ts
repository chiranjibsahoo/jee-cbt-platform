import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const analyticsRouter = Router();

// Dashboard stats
analyticsRouter.get('/dashboard', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const snapshots = await prisma.performanceSnapshot.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const attempts = await prisma.examAttempt.findMany({
      where: { userId, status: { not: 'IN_PROGRESS' } },
      include: { exam: { select: { title: true, examType: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const totalAttempts = snapshots.length;
    const avgScore = totalAttempts > 0
      ? snapshots.reduce((sum, s) => sum + s.percentage, 0) / totalAttempts : 0;
    const bestScore = totalAttempts > 0
      ? Math.max(...snapshots.map(s => s.percentage)) : 0;
    const avgAccuracy = totalAttempts > 0
      ? snapshots.reduce((sum, s) => sum + s.accuracy, 0) / totalAttempts : 0;
    const totalQuestionsAttempted = snapshots.reduce(
      (sum, s) => sum + s.correctCount + s.incorrectCount, 0
    );

    // Subject performance
    const subjectStats: Record<string, { totalScore: number; count: number }> = {
      PHYSICS: { totalScore: 0, count: 0 },
      CHEMISTRY: { totalScore: 0, count: 0 },
      MATHEMATICS: { totalScore: 0, count: 0 },
    };

    for (const s of snapshots) {
      if (s.physicsScore !== null) {
        subjectStats.PHYSICS.totalScore += s.physicsScore;
        subjectStats.PHYSICS.count++;
      }
      if (s.chemistryScore !== null) {
        subjectStats.CHEMISTRY.totalScore += s.chemistryScore;
        subjectStats.CHEMISTRY.count++;
      }
      if (s.mathScore !== null) {
        subjectStats.MATHEMATICS.totalScore += s.mathScore;
        subjectStats.MATHEMATICS.count++;
      }
    }

    const subjectAverages = Object.entries(subjectStats).map(([subject, data]) => ({
      subject,
      average: data.count > 0 ? data.totalScore / data.count : 0,
    }));

    const strongestSubject = subjectAverages.sort((a, b) => b.average - a.average)[0]?.subject;
    const weakestSubject = subjectAverages.sort((a, b) => a.average - b.average)[0]?.subject;

    res.json({
      totalAttempts,
      avgScore: Math.round(avgScore * 100) / 100,
      bestScore: Math.round(bestScore * 100) / 100,
      avgAccuracy: Math.round(avgAccuracy * 100) / 100,
      totalQuestionsAttempted,
      strongestSubject,
      weakestSubject,
      recentAttempts: attempts,
      performanceTrend: snapshots.map(s => ({
        date: s.createdAt,
        score: s.totalScore,
        maxScore: s.maxScore,
        percentage: s.percentage,
        accuracy: s.accuracy,
        examTitle: s.examTitle,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Chapter analysis across all attempts
analyticsRouter.get('/chapters', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { subject } = req.query;

    const answers = await prisma.attemptAnswer.findMany({
      where: {
        attempt: { userId, status: { not: 'IN_PROGRESS' } },
        ...(subject ? { subject: subject as any } : {}),
      },
      include: {
        question: { select: { chapter: true, subject: true } },
      },
    });

    const chapterMap: Record<string, { correct: number; incorrect: number; unanswered: number; subject: string }> = {};

    for (const ans of answers) {
      const chapter = ans.question.chapter;
      const sub = ans.question.subject;
      if (!chapterMap[chapter]) {
        chapterMap[chapter] = { correct: 0, incorrect: 0, unanswered: 0, subject: sub };
      }
      if (ans.isCorrect === true) chapterMap[chapter].correct++;
      else if (ans.isCorrect === false) chapterMap[chapter].incorrect++;
      else chapterMap[chapter].unanswered++;
    }

    const chapters = Object.entries(chapterMap).map(([chapter, stats]) => ({
      chapter,
      subject: stats.subject,
      correct: stats.correct,
      incorrect: stats.incorrect,
      unanswered: stats.unanswered,
      total: stats.correct + stats.incorrect + stats.unanswered,
      accuracy: (stats.correct + stats.incorrect) > 0
        ? (stats.correct / (stats.correct + stats.incorrect)) * 100 : 0,
    })).sort((a, b) => b.total - a.total);

    res.json(chapters);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chapter analytics' });
  }
});
