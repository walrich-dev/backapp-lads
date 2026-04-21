import { NextFunction, Request, Response } from 'express';
import { JwtPayload, verifyAccessToken } from '../utils/jwt';
import { forbidden, unauthorized } from '../utils/response';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    unauthorized(res, 'Token de acesso necessário');
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    unauthorized(res, 'Token inválido ou expirado');
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res);
      return;
    }
    if (!roles.includes(req.user.role)) {
      forbidden(res, 'Permissão insuficiente para esta ação');
      return;
    }
    next();
  };
};
