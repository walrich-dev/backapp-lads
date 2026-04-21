import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/professionalsController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// GET /api/professionals
router.get('/', ctrl.listProfessionals);

// GET /api/professionals/:id
router.get('/:id', ctrl.getProfessional);

// POST /api/professionals (become a professional)
router.post(
  '/',
  authenticate,
  [
    body('headline').trim().notEmpty().withMessage('Headline é obrigatória'),
    body('affiliation').trim().notEmpty().withMessage('Afiliação é obrigatória'),
    body('memberSince').trim().notEmpty().withMessage('Membro desde é obrigatório'),
    validate,
  ],
  ctrl.becomeProfessional
);

// PATCH /api/professionals/:id
router.patch(
  '/:id',
  authenticate,
  ctrl.updateProfessional
);

export default router;
