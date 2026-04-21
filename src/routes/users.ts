import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/usersController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /api/users/:id
router.get('/:id', ctrl.getUser);

// PATCH /api/users/me  (profile update)
router.patch(
  '/me',
  [body('name').optional().trim().notEmpty().withMessage('Nome não pode ser vazio'), validate],
  ctrl.updateMe
);

// GET /api/users/me/stats
router.get('/me/stats', ctrl.getMyStats);

// PATCH /api/users/me/password
router.patch(
  '/me/password',
  [
    body('currentPassword').notEmpty().withMessage('Senha atual é obrigatória'),
    body('newPassword').isLength({ min: 6 }).withMessage('Nova senha deve ter ao menos 6 caracteres'),
    validate,
  ],
  ctrl.changePassword
);

export default router;
