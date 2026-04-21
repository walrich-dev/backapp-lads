import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/servicesController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';


const router = Router();

// GET /api/services/categories
router.get('/categories', ctrl.listCategories);

// GET /api/services/requests (my requests - must be before /:id)
router.get('/requests', authenticate, ctrl.listMyRequests);

// POST /api/services/requests
router.post(
  '/requests',
  authenticate,
  [body('serviceId').notEmpty().withMessage('Service ID é obrigatório'), validate],
  ctrl.createRequest
);

// GET /api/services/requests/:id
router.get('/requests/:id', authenticate, ctrl.getRequest);

// DELETE /api/services/requests/:id (cancel)
router.delete('/requests/:id', authenticate, ctrl.cancelRequest);

// PATCH /api/services/requests/:id
router.patch(
  '/requests/:id',
  authenticate,
  [body('status').isIn(['CONCLUIDO', 'PROGRESSO', 'ORCAMENTO', 'CANCELADO']).withMessage('Status inválido'), validate],
  ctrl.updateRequestStatus
);

// GET /api/services
router.get('/', ctrl.listServices);

// GET /api/services/:id
router.get('/:id', ctrl.getService);

export default router;
