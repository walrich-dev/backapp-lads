import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/forumController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// GET /api/forum/posts
router.get('/posts', ctrl.listPosts);

// GET /api/forum/posts/:id
router.get('/posts/:id', ctrl.getPost);

// POST /api/forum/posts
router.post(
  '/posts',
  authenticate,
  [body('title').trim().notEmpty().withMessage('Título é obrigatório'), validate],
  ctrl.createPost
);

// DELETE /api/forum/posts/:id
router.delete('/posts/:id', authenticate, ctrl.deletePost);

// POST /api/forum/posts/:id/like
router.post('/posts/:id/like', authenticate, ctrl.toggleLike);

// GET /api/forum/posts/:id/comments
router.get('/posts/:id/comments', ctrl.listComments);

// POST /api/forum/posts/:id/comments
router.post(
  '/posts/:id/comments',
  authenticate,
  [body('content').trim().notEmpty().withMessage('Conteúdo é obrigatório'), validate],
  ctrl.createComment
);

// DELETE /api/forum/comments/:id
router.delete('/comments/:id', authenticate, ctrl.deleteComment);

export default router;
