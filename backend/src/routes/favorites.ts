import { Router } from 'express';
import { toggleFavorite, getFavorites } from './favorites.controller';
import { authenticate } from '../../middleware/authHandler';

const router = Router();

router.post('/', authenticate, toggleFavorite);
router.get('/', authenticate, getFavorites);

export default router;
