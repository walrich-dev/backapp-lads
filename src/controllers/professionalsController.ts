import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import * as R from '../utils/response';

const professionalSelect = {
  id: true,
  headline: true,
  affiliation: true,
  memberSince: true,
  website: true,
  linkedin: true,
  github: true,
  rating: true,
  votes: true,
  user: {
    select: { id: true, name: true, email: true, avatarUrl: true, role: true },
  },
  expertise: { select: { id: true, name: true } },
  achievements: { select: { id: true, title: true } },
};

// GET /api/professionals
export const listProfessionals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filter, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { headline: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (filter && filter !== 'todos') {
      where.expertise = { some: { name: { contains: filter, mode: 'insensitive' } } };
    }

    const [professionals, total] = await Promise.all([
      prisma.professional.findMany({
        where,
        select: professionalSelect,
        skip,
        take: limitNum,
        orderBy: { rating: 'desc' },
      }),
      prisma.professional.count({ where }),
    ]);

    R.paginated(res, professionals, total, pageNum, limitNum);
  } catch (err) { console.error(err); R.serverError(res); }
};

// GET /api/professionals/:id
export const getProfessional = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const professional = await prisma.professional.findUnique({
      where: { id },
      select: {
        ...professionalSelect,
        services: {
          select: { id: true, title: true, description: true, price: true, category: true },
        },
      },
    });
    if (!professional) { R.notFoundResp(res, 'Profissional não encontrado'); return; }
    R.ok(res, professional);
  } catch (err) { console.error(err); R.serverError(res); }
};

// POST /api/professionals (turn current user into professional)
export const becomeProfessional = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { headline, affiliation, memberSince, website, linkedin, github, expertise, achievements } =
      req.body as {
        headline: string; affiliation: string; memberSince: string;
        website?: string; linkedin?: string; github?: string;
        expertise?: string[]; achievements?: string[];
      };

    const existing = await prisma.professional.findUnique({ where: { userId } });
    if (existing) { R.conflict(res, 'Perfil profissional já existe'); return; }

    const professional = await prisma.professional.create({
      data: {
        userId,
        headline, affiliation, memberSince, website, linkedin, github,
        expertise: { create: (expertise ?? []).map((name) => ({ name })) },
        achievements: { create: (achievements ?? []).map((title) => ({ title })) },
      },
      select: professionalSelect,
    });

    await prisma.user.update({ where: { id: userId }, data: { role: 'PROFESSIONAL' } });
    R.created(res, professional, 'Perfil profissional criado');
  } catch (err) { console.error(err); R.serverError(res); }
};

// PATCH /api/professionals/:id
export const updateProfessional = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const prof = await prisma.professional.findUnique({ where: { id } });

    if (!prof) { R.notFoundResp(res, 'Profissional não encontrado'); return; }
    if (prof.userId !== userId && req.user!.role !== 'ADMIN') {
      R.forbidden(res); return;
    }

    const { headline, affiliation, website, linkedin, github, expertise, achievements } = req.body as {
      headline?: string; affiliation?: string; website?: string;
      linkedin?: string; github?: string; expertise?: string[]; achievements?: string[];
    };

    const updated = await prisma.professional.update({
      where: { id },
      data: {
        headline, affiliation, website, linkedin, github,
        ...(expertise && {
          expertise: { deleteMany: {}, create: expertise.map((name) => ({ name })) },
        }),
        ...(achievements && {
          achievements: { deleteMany: {}, create: achievements.map((title) => ({ title })) },
        }),
      },
      select: professionalSelect,
    });
    R.ok(res, updated, 'Perfil profissional atualizado');
  } catch (err) { console.error(err); R.serverError(res); }
};
