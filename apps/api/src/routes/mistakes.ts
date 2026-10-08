import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const mistakeRouter = Router();

// Get mistakes
mistakeRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subject, mistakeType, isResolved } = req.query;
    const mistakes = await prisma.mistake.findMany({
      where: {
        userId: req.user!.id,
        ...(isResolved !== undefined ? { isResolved: isResolved === 'true' } : {}),
        ...(mistakeType ? { mistakeType: mistakeType as any } : {}),
        ...(subject ? { question: { subject: subject as any } } : {}),
      },
      include: { question: { include: { options: { orderBy: { order: 'asc' } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(mistakes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mistakes' });
  }
});

// Add mistake
mistakeRouter.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questionId, attemptId, mistakeType, note } = req.body;
    const mistake = await prisma.mistake.create({
      data: { userId: req.user!.id, questionId, attemptId, mistakeType, note },
      include: { question: { include: { options: { orderBy: { order: 'asc' } } } } },
    });
    res.status(201).json(mistake);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add mistake' });
  }
});

// Update mistake
mistakeRouter.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { note, isResolved } = req.body;
    const mistake = await prisma.mistake.update({
      where: { id: req.params.id },
      data: { note, isResolved },
    });
    res.json(mistake);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update mistake' });
  }
});

// Delete mistake
mistakeRouter.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.mistake.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete mistake' });
  }
});
