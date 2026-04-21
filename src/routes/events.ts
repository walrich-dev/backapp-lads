import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/eventsController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// GET /api/events
router.get('/', ctrl.listEvents);

// GET /api/events/:id
router.get('/:id', ctrl.getEvent);

// POST /api/events  (Coordinator or Admin only)
router.post(
  '/',
  authenticate,
  requireRole('COORDINATOR', 'ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('dateLabel').trim().notEmpty().withMessage('Data é obrigatória'),
    body('date').isISO8601().withMessage('Data inválida (ISO 8601)'),
    validate,
  ],
  ctrl.createEvent
);

// PATCH /api/events/:id
router.patch(
  '/:id',
  authenticate,
  requireRole('COORDINATOR', 'ADMIN'),
  ctrl.updateEvent
);

// DELETE /api/events/:id
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  ctrl.deleteEvent
);

// GET /api/events/:id/subscribed  (check if logged-in user is subscribed)
router.get('/:id/subscribed', authenticate, ctrl.checkSubscribed);

// POST /api/events/:id/subscribe
router.post('/:id/subscribe', authenticate, ctrl.subscribeEvent);

// DELETE /api/events/:id/subscribe
router.delete('/:id/subscribe', authenticate, ctrl.unsubscribeEvent);

export default router;
