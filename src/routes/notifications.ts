import { Router } from 'express';
import * as ctrl from '../controllers/notificationsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications/unread-count
router.get('/unread-count', ctrl.getUnreadCount);

// GET /api/notifications
router.get('/', ctrl.listNotifications);

// POST /api/notifications/read-all
router.post('/read-all', ctrl.markAllRead);

// DELETE /api/notifications  (clear all)
router.delete('/', ctrl.deleteAllNotifications);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', ctrl.markRead);

// DELETE /api/notifications/:id
router.delete('/:id', ctrl.deleteNotification);

export default router;
