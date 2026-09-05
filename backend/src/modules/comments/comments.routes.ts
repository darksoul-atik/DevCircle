import { Router } from 'express';
import { createComment, getComments, updateComment, deleteComment } from './comments.controller';
import { requireAuth } from '../../middleware/authHandler';

// mergeParams: true allows us to access :id from the parent router (posts.routes.ts)
const router = Router({ mergeParams: true });

router.get('/', getComments);
router.post('/', requireAuth, createComment);
router.put('/:commentId', requireAuth, updateComment);
router.delete('/:commentId', requireAuth, deleteComment);

export default router;
