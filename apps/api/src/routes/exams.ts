import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const examRouter = Router();

// Get all published exams
examRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { examType, mode } = req.query;
    const exams = await prisma.exam.findMany({
      where: {
        isPublished: true,
        ...(examType ? { examType: examType as any } : {}),
        ...(mode ? { mode: mode as any } : {}),
      },
      include: {
        sections: {
          include: { questions: true },
        },
        config: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// Get single exam
examRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: {
        sections: {
          include: {
            questions: {
              include: {
                question: {
                  include: { options: { orderBy: { order: 'asc' } } },
                },
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
      res.status(404).json({ error: 'Exam not found' });
      return;
    }

    res.json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});
