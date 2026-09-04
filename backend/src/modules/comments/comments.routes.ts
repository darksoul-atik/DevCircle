import { Router } from 'express';
import { createComment, getComments } from './comments.controller';
import { requireAuth } from '../../middleware/authHandler';

// mergeParams: true allows us to access :id from the parent router (posts.routes.ts)
const router = Router({ mergeParams: true });

router.get('/', getComments);
router.post('/', requireAuth, createComment);

export default router;
