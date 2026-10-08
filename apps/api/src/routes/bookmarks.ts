import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const bookmarkRouter = Router();

// Get bookmarks
bookmarkRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user!.id },
      include: { question: { include: { options: { orderBy: { order: 'asc' } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// Toggle bookmark
bookmarkRouter.post('/toggle', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questionId, note } = req.body;
    const userId = req.user!.id;

    const existing = await prisma.bookmark.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { userId_questionId: { userId, questionId } } });
      res.json({ bookmarked: false });
    } else {
      await prisma.bookmark.create({ data: { userId, questionId, note } });
      res.json({ bookmarked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

// Delete bookmark
bookmarkRouter.delete('/:questionId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.bookmark.delete({
      where: { userId_questionId: { userId: req.user!.id, questionId: req.params.questionId } },
    });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete bookmark' });
  }
});
