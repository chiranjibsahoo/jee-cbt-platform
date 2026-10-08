import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const questionRouter = Router();

// Get questions with filters
questionRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subject, chapter, difficulty, questionType, examType, isPYQ, year, page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const questions = await prisma.question.findMany({
      where: {
        isActive: true,
        ...(subject ? { subject: subject as any } : {}),
        ...(chapter ? { chapter: { contains: chapter as string } } : {}),
        ...(difficulty ? { difficulty: difficulty as any } : {}),
        ...(questionType ? { questionType: questionType as any } : {}),
        ...(examType ? { examType: examType as any } : {}),
        ...(isPYQ !== undefined ? { isPYQ: isPYQ === 'true' } : {}),
        ...(year ? { year: parseInt(year as string) } : {}),
      },
      include: {
        options: { orderBy: { order: 'asc' } },
      },
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.question.count({
      where: {
        isActive: true,
        ...(subject ? { subject: subject as any } : {}),
        ...(chapter ? { chapter: { contains: chapter as string } } : {}),
        ...(difficulty ? { difficulty: difficulty as any } : {}),
        ...(questionType ? { questionType: questionType as any } : {}),
        ...(examType ? { examType: examType as any } : {}),
      },
    });

    res.json({ questions, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Get single question (without revealing correct answer in exam mode)
questionRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: { options: { orderBy: { order: 'asc' } } },
    });

    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    res.json(question);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});
