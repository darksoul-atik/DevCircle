import { Router } from 'express';
import { toggleReaction } from './reactions.controller';
import { requireAuth } from '../../middleware/authHandler';

const router = Router();

router.post('/', requireAuth, toggleReaction);

export default router;
