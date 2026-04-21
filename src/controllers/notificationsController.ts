import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import * as R from '../utils/response';

// GET /api/notifications
export const listNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { page = '1', limit = '30', unreadOnly } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { userId };
    if (unreadOnly === 'true') where.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    R.paginated(res, notifications, total, pageNum, limitNum, { unreadCount });
  } catch (err) { console.error(err); R.serverError(res); }
};

// PATCH /api/notifications/:id/read
export const markRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) { R.notFoundResp(res, 'Notificação não encontrada'); return; }
    if (notification.userId !== userId) { R.forbidden(res); return; }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    R.ok(res, updated, 'Notificação marcada como lida');
  } catch (err) { console.error(err); R.serverError(res); }
};

// POST /api/notifications/read-all
export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    R.ok(res, null, 'Todas as notificações marcadas como lidas');
  } catch (err) { console.error(err); R.serverError(res); }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) { R.notFoundResp(res, 'Notificação não encontrada'); return; }
    if (notification.userId !== userId) { R.forbidden(res); return; }

    await prisma.notification.delete({ where: { id } });
    R.noContent(res);
  } catch (err) { console.error(err); R.serverError(res); }
};

// DELETE /api/notifications  (clear all)
export const deleteAllNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await prisma.notification.deleteMany({ where: { userId } });
    R.noContent(res);
  } catch (err) { console.error(err); R.serverError(res); }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const count = await prisma.notification.count({ where: { userId, read: false } });
    R.ok(res, { count });
  } catch (err) { console.error(err); R.serverError(res); }
};
