import { Router } from 'express';
import { createPost, getPosts, getPostById } from './posts.controller';
import { requireAuth } from '../../middleware/authHandler';
import commentsRoutes from '../comments/comments.routes';

const router = Router();

router.post('/', requireAuth, createPost);
router.get('/', getPosts);
router.get('/:id', getPostById);
router.use('/:id/comments', commentsRoutes);

export default router;
