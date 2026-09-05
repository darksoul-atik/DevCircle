import { Router } from 'express';
import { getCommunities, createCommunity, getCommunityPosts } from '../modules/communities/communities.controller';
import { requireAuth } from '../middleware/authHandler';
import { upload } from '../utils/multer';

const router = Router();

router.get('/', getCommunities);
router.post('/', requireAuth, upload.single('icon'), createCommunity);
router.get('/:slug/posts', getCommunityPosts);

export default router;
