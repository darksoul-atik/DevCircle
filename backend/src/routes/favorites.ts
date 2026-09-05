import { Router } from 'express';
import { toggleFavorite, getFavorites } from '../modules/favorites/favorites.controller';
import { requireAuth } from '../middleware/authHandler';

const router = Router();

router.post('/', requireAuth, toggleFavorite);
router.get('/', requireAuth, getFavorites);

export default router;
