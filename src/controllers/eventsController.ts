import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import * as R from '../utils/response';

// GET /api/events
export const listEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', upcoming } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const where = upcoming === 'true' ? { date: { gte: new Date() } } : {};
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where, skip, take: limitNum,
        orderBy: { date: 'asc' },
        include: { _count: { select: { forumPosts: true } } },
      }),
      prisma.event.count({ where }),
    ]);

    R.paginated(res, events, total, pageNum, limitNum);
  } catch (err) { console.error(err); R.serverError(res); }
};

// GET /api/events/:id
export const getEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { forumPosts: true } } },
    });
    if (!event) { R.notFoundResp(res, 'Evento não encontrado'); return; }
    R.ok(res, event);
  } catch (err) { console.error(err); R.serverError(res); }
};

// POST /api/events  (admin / coordinator only)
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, emoji, dateLabel, date, location } = req.body as {
      name: string; description?: string; emoji?: string;
      dateLabel: string; date: string; location?: string;
    };

    const event = await prisma.event.create({
      data: { name, description, emoji, dateLabel, date: new Date(date), location },
    });
    R.created(res, event, 'Evento criado');
  } catch (err) { console.error(err); R.serverError(res); }
};

// PATCH /api/events/:id
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, emoji, dateLabel, date, location } = req.body as {
      name?: string; description?: string; emoji?: string;
      dateLabel?: string; date?: string; location?: string;
    };

    const event = await prisma.event.update({
      where: { id },
      data: { name, description, emoji, dateLabel, ...(date && { date: new Date(date) }), location },
    });
    R.ok(res, event, 'Evento atualizado');
  } catch (err) { console.error(err); R.serverError(res); }
};

// DELETE /api/events/:id
export const deleteEvent = async (_req: Request, res: Response): Promise<void> => {
  try {
    await prisma.event.delete({ where: { id: _req.params.id } });
    R.noContent(res);
  } catch (err) { console.error(err); R.serverError(res); }
};

// POST /api/events/:id/subscribe
export const subscribeEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const eventId = req.params.id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) { R.notFoundResp(res, 'Evento não encontrado'); return; }

    const existing = await prisma.eventSubscription.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing) { R.conflict(res, 'Já inscrito neste evento'); return; }

    const sub = await prisma.eventSubscription.create({ data: { userId, eventId } });

    // Increment subscribers count
    await prisma.event.update({ where: { id: eventId }, data: { subscribers: { increment: 1 } } });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'EVENT_REMINDER',
        title: `Inscrição confirmada: ${event.name}`,
        body: `Você se inscreveu no evento "${event.name}" em ${event.dateLabel}.`,
        meta: JSON.stringify({ eventId }),
      },
    });

    R.created(res, sub, 'Inscrito com sucesso');
  } catch (err) { console.error(err); R.serverError(res); }
};

// DELETE /api/events/:id/subscribe
export const unsubscribeEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const eventId = req.params.id;

    const existing = await prisma.eventSubscription.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!existing) { R.notFoundResp(res, 'Inscrição não encontrada'); return; }

    await prisma.eventSubscription.delete({ where: { userId_eventId: { userId, eventId } } });
    await prisma.event.update({ where: { id: eventId }, data: { subscribers: { decrement: 1 } } });

    R.noContent(res);
  } catch (err) { console.error(err); R.serverError(res); }
};

// GET /api/events/:id/subscribed
export const checkSubscribed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const eventId = req.params.id;
    const sub = await prisma.eventSubscription.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    R.ok(res, { subscribed: !!sub });
  } catch (err) { console.error(err); R.serverError(res); }
};
