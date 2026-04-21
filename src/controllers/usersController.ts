import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { comparePassword, hashPassword } from '../utils/password';
import * as R from '../utils/response';

// GET /api/users/:id
export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });
    if (!user) { R.notFoundResp(res, 'Usuário não encontrado'); return; }
    R.ok(res, user);
  } catch (err) { console.error(err); R.serverError(res); }
};

// PATCH /api/users/me
export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { name, bio, avatarUrl } = req.body as { name?: string; bio?: string; avatarUrl?: string };
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, bio, avatarUrl },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, bio: true },
    });
    R.ok(res, user, 'Perfil atualizado');
  } catch (err) { console.error(err); R.serverError(res); }
};

// GET /api/users/me/stats
export const getMyStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const [postsCount, commentsCount, requestsCount, likesGiven, eventsSubscribed] =
      await Promise.all([
        prisma.forumPost.count({ where: { authorId: userId } }),
        prisma.forumComment.count({ where: { authorId: userId } }),
        prisma.serviceRequest.count({ where: { userId } }),
        prisma.postLike.count({ where: { userId } }),
        prisma.eventSubscription.count({ where: { userId } }),
      ]);
    R.ok(res, { postsCount, commentsCount, requestsCount, likesGiven, eventsSubscribed });
  } catch (err) { console.error(err); R.serverError(res); }
};

// PATCH /api/users/me/password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { R.notFoundResp(res); return; }

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) { R.badRequest(res, 'Senha atual incorreta'); return; }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await prisma.refreshToken.deleteMany({ where: { userId } });

    R.ok(res, null, 'Senha alterada com sucesso');
  } catch (err) { console.error(err); R.serverError(res); }
};
