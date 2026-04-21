import crypto from 'crypto';
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';
import * as R from '../utils/response';

// ─── Register ────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      R.conflict(res, 'E-mail já cadastrado');
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true },
    });

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    R.created(res, { user, accessToken, refreshToken }, 'Conta criada com sucesso');
  } catch (err) {
    console.error(err);
    R.serverError(res);
  }
};

// ─── Login ───────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      R.unauthorized(res, 'E-mail ou senha incorretos');
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      R.unauthorized(res, 'E-mail ou senha incorretos');
      return;
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    R.ok(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        accessToken,
        refreshToken,
      },
      'Login realizado com sucesso'
    );
  } catch (err) {
    console.error(err);
    R.serverError(res);
  }
};

// ─── Refresh Token ───────────────────────────────────────────
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) {
      R.unauthorized(res, 'Refresh token necessário');
      return;
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      R.unauthorized(res, 'Refresh token inválido ou expirado');
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      R.unauthorized(res, 'Usuário não encontrado');
      return;
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    R.ok(res, { accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    R.unauthorized(res, 'Token inválido');
  }
};

// ─── Logout ──────────────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    R.ok(res, null, 'Logout realizado com sucesso');
  } catch (err) {
    console.error(err);
    R.serverError(res);
  }
};

// ─── Forgot Password ─────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email: string };
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to avoid user enumeration
    if (!user) {
      R.ok(res, null, 'Se o e-mail existir, você receberá as instruções de recuperação');
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordReset.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // NOTE: In production, send an email with the token link.
    // For development, we return the token directly.
    console.log(`[DEV] Password reset token for ${email}: ${token}`);

    R.ok(res, null, 'Se o e-mail existir, você receberá as instruções de recuperação');
  } catch (err) {
    console.error(err);
    R.serverError(res);
  }
};

// ─── Reset Password ──────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body as { token: string; password: string };

    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      R.badRequest(res, 'Token inválido ou expirado');
      return;
    }

    const passwordHash = await hashPassword(password);
    await Promise.all([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      prisma.refreshToken.deleteMany({ where: { userId: reset.userId } }),
    ]);

    R.ok(res, null, 'Senha redefinida com sucesso');
  } catch (err) {
    console.error(err);
    R.serverError(res);
  }
};

// ─── Me ──────────────────────────────────────────────────────
export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        professional: {
          include: {
            expertise: true,
            achievements: true,
          },
        },
      },
    });

    if (!user) {
      R.notFoundResp(res, 'Usuário não encontrado');
      return;
    }

    R.ok(res, user);
  } catch (err) {
    console.error(err);
    R.serverError(res);
  }
};
