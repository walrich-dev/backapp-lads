import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import * as R from '../utils/response';

// GET /api/services/categories
export const listCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      include: { _count: { select: { services: true } } },
    });
    R.ok(res, categories);
  } catch (err) { console.error(err); R.serverError(res); }
};

// GET /api/services
export const listServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const where = categoryId ? { categoryId } : {};
    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          category: true,
          professional: {
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          },
        },
        skip, take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.service.count({ where }),
    ]);

    R.paginated(res, services, total, pageNum, limitNum);
  } catch (err) { console.error(err); R.serverError(res); }
};

// GET /api/services/:id
export const getService = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        professional: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } }, expertise: true },
        },
      },
    });
    if (!service) { R.notFoundResp(res, 'Serviço não encontrado'); return; }
    R.ok(res, service);
  } catch (err) { console.error(err); R.serverError(res); }
};

// GET /api/services/requests (my requests)
export const listMyRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const requests = await (prisma.serviceRequest as any).findMany({
      where: { userId, status: { not: 'CANCELADO' } },
      include: { service: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
    // Enrich free-form requests with parsed prazo from meta JSON
    const enriched = requests.map((r: any) => {
      let prazo: string | undefined;
      if (!r.serviceId && r.meta) {
        try { prazo = JSON.parse(r.meta).prazo; } catch { /* ignore */ }
      }
      return { ...r, prazo };
    });
    R.ok(res, { requests: enriched });
  } catch (err) { console.error(err); R.serverError(res); }
};

// POST /api/services/requests
export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { serviceId, title, categoria, descricao, orcamento, prazo, meta } =
      req.body as {
        serviceId?: string;
        title?: string;
        categoria?: string;
        descricao?: string;
        orcamento?: string;
        prazo?: string;
        meta?: string;
      };

    // Free-form request (no serviceId): title is required
    if (!serviceId) {
      if (!title?.trim()) { R.badRequest(res, 'Título é obrigatório'); return; }
      const metaJson = JSON.stringify({ categoria, descricao, orcamento, prazo });
      const request = await (prisma.serviceRequest as any).create({
        data: { title: title.trim(), userId, meta: metaJson, status: 'ORCAMENTO' },
      });
      R.created(res, { ...request, service: null }, 'Solicitação criada');
      return;
    }

    // Service-linked request
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) { R.notFoundResp(res, 'Serviço não encontrado'); return; }

    const request = await (prisma.serviceRequest as any).create({
      data: { serviceId, userId, meta, status: 'ORCAMENTO' },
      include: { service: { include: { category: true } } },
    });
    R.created(res, request, 'Solicitação criada');
  } catch (err) { console.error(err); R.serverError(res); }
};

// GET /api/services/requests/:id
export const getRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            category: true,
            professional: {
              include: { user: { select: { id: true, name: true, avatarUrl: true } }, expertise: true },
            },
          },
        },
      },
    });
    if (!request) { R.notFoundResp(res, 'Solicitação não encontrada'); return; }
    // Only the requester, the professional, or an admin can view
    const isProfessional = request.service?.professional?.user?.id === userId;
    if (request.userId !== userId && !isProfessional && req.user!.role !== 'ADMIN') {
      R.forbidden(res); return;
    }
    R.ok(res, request);
  } catch (err) { console.error(err); R.serverError(res); }
};

// DELETE /api/services/requests/:id  (cancel by owner)
export const cancelRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const existing = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existing) { R.notFoundResp(res, 'Solicitação não encontrada'); return; }
    if (existing.userId !== userId && req.user!.role !== 'ADMIN') { R.forbidden(res); return; }
    if (existing.status === 'CONCLUIDO') { R.badRequest(res, 'Não é possível cancelar uma solicitação concluída'); return; }
    const updated = await prisma.serviceRequest.update({
      where: { id }, data: { status: 'CANCELADO' },
      include: { service: { include: { category: true } } },
    });
    R.ok(res, updated, 'Solicitação cancelada');
  } catch (err) { console.error(err); R.serverError(res); }
};

// PATCH /api/services/requests/:id
export const updateRequestStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: 'CONCLUIDO' | 'PROGRESSO' | 'ORCAMENTO' };

    const existing = await prisma.serviceRequest.findUnique({
      where: { id },
      include: { service: { include: { professional: true } } },
    });
    if (!existing) { R.notFoundResp(res, 'Solicitação não encontrada'); return; }

    const isOwner = existing.userId === req.user!.userId;
    const isProfessional = existing.service?.professional?.userId === req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isOwner && !isProfessional && !isAdmin) { R.forbidden(res); return; }

    const updated = await prisma.serviceRequest.update({
      where: { id }, data: { status },
      include: { service: { include: { category: true } } },
    });

    // Notify the requester about the status change (skip if they updated themselves)
    if (existing.userId !== req.user!.userId) {
      const statusLabels: Record<string, string> = {
        ORCAMENTO: 'Em orçamento',
        PROGRESSO: 'Em andamento',
        CONCLUIDO: 'Concluído',
        CANCELADO: 'Cancelado',
      };
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          type: 'REQUEST_STATUS',
          title: 'Atualização na sua solicitação',
          body: `Sua solicitação para "${updated.service?.title ?? 'serviço'}" está agora: ${statusLabels[status] ?? status}.`,
          meta: JSON.stringify({ requestId: id }),
        },
      }).catch(() => { /* non-critical */ });
    }

    R.ok(res, updated, 'Status atualizado');
  } catch (err) { console.error(err); R.serverError(res); }
};
