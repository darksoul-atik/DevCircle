import { Router } from 'express';
import { getCommunities, createCommunity, getCommunityPosts } from '../modules/communities/communities.controller';
import { authenticate } from '../middleware/authHandler';

const router = Router();

router.get('/', getCommunities);
router.post('/', authenticate, createCommunity);
router.get('/:slug/posts', getCommunityPosts);

export default router;
