import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import * as R from '../utils/response';

const postSelect = {
  id: true,
  title: true,
  content: true,
  icon: true,
  tag: true,
  likes: true,
  pinned: true,
  createdAt: true,
  author: { select: { id: true, name: true, avatarUrl: true } },
  event: { select: { id: true, name: true } },
  _count: { select: { comments: true } },
};

// GET /api/forum/posts
export const listPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tag, eventId, pinned, page = '1', limit = '20', search } =
      req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (tag) where.tag = tag;
    if (eventId) where.eventId = eventId;
    if (pinned === 'true') where.pinned = true;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where, select: postSelect, skip, take: limitNum,
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.forumPost.count({ where }),
    ]);

    R.paginated(res, posts, total, pageNum, limitNum);
  } catch (err) { console.error(err); R.serverError(res); }
};

// GET /api/forum/posts/:id
export const getPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await prisma.forumPost.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        event: { select: { id: true, name: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true, avatarUrl: true } } },
        },
        _count: { select: { comments: true, postLikes: true } },
      },
    });
    if (!post) { R.notFoundResp(res, 'Post não encontrado'); return; }
    R.ok(res, post);
  } catch (err) { console.error(err); R.serverError(res); }
};

// POST /api/forum/posts
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { title, content, icon = 'BULB', tag = 'GERAL', eventId } = req.body as {
      title: string; content?: string; icon?: string;
      tag?: string; eventId?: string;
    };

    const post = await prisma.forumPost.create({
      data: { title, content, icon, tag, authorId: userId, eventId },
      select: postSelect,
    });
    R.created(res, post, 'Post criado');
  } catch (err) { console.error(err); R.serverError(res); }
};

// DELETE /api/forum/posts/:id
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await prisma.forumPost.findUnique({ where: { id } });
    if (!post) { R.notFoundResp(res, 'Post não encontrado'); return; }
    if (post.authorId !== req.user!.userId && req.user!.role !== 'ADMIN' && req.user!.role !== 'COORDINATOR') {
      R.forbidden(res); return;
    }
    await prisma.forumPost.delete({ where: { id } });
    R.noContent(res);
  } catch (err) { console.error(err); R.serverError(res); }
};

// POST /api/forum/posts/:id/like
export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const postId = req.params.id;

    const post = await prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) { R.notFoundResp(res, 'Post não encontrado'); return; }

    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await prisma.postLike.delete({ where: { postId_userId: { postId, userId } } });
      await prisma.forumPost.update({ where: { id: postId }, data: { likes: { decrement: 1 } } });
      R.ok(res, { liked: false });
    } else {
      await prisma.postLike.create({ data: { postId, userId } });
      await prisma.forumPost.update({ where: { id: postId }, data: { likes: { increment: 1 } } });
      R.ok(res, { liked: true });
    }
  } catch (err) { console.error(err); R.serverError(res); }
};

// GET /api/forum/posts/:id/comments
export const listComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const comments = await prisma.forumComment.findMany({
      where: { postId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
    R.ok(res, comments);
  } catch (err) { console.error(err); R.serverError(res); }
};

// POST /api/forum/posts/:id/comments
export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { content } = req.body as { content: string };
    const postId = req.params.id;

    const post = await prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) { R.notFoundResp(res, 'Post não encontrado'); return; }

    const comment = await prisma.forumComment.create({
      data: { content, postId, authorId: userId },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });

    // Notify post author (skip if commenting on own post)
    if (post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'NEW_COMMENT',
          title: 'Novo comentário no seu post',
          body: `${comment.author.name} comentou: "${content.substring(0, 80)}${content.length > 80 ? '…' : ''}"`,
          meta: JSON.stringify({ postId, commentId: comment.id }),
        },
      }).catch(() => { /* non-critical */ });
    }

    R.created(res, comment, 'Comentário adicionado');
  } catch (err) { console.error(err); R.serverError(res); }
};

// DELETE /api/forum/comments/:id
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const comment = await prisma.forumComment.findUnique({ where: { id } });
    if (!comment) { R.notFoundResp(res, 'Comentário não encontrado'); return; }
    if (comment.authorId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      R.forbidden(res); return;
    }
    await prisma.forumComment.delete({ where: { id } });
    R.noContent(res);
  } catch (err) { console.error(err); R.serverError(res); }
};
