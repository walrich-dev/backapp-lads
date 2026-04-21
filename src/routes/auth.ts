import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório').isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail().withMessage('E-mail inválido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Senha deve ter ao menos 6 caracteres'),
    validate,
  ],
  ctrl.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('E-mail inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
    validate,
  ],
  ctrl.login
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token é obrigatório'), validate],
  ctrl.refresh
);

// POST /api/auth/logout
router.post('/logout', ctrl.logout);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('E-mail inválido'), validate],
  ctrl.forgotPassword
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token é obrigatório'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Senha deve ter ao menos 6 caracteres'),
    validate,
  ],
  ctrl.resetPassword
);

// GET /api/auth/me
router.get('/me', authenticate, ctrl.me);

export default router;
