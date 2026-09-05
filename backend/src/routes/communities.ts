import { Router } from 'express';
import { getCommunities, createCommunity, getCommunityPosts, updateCommunity } from '../modules/communities/communities.controller';
import { requireAuth } from '../middleware/authHandler';
import { upload } from '../utils/multer';

const router = Router();

router.get('/', getCommunities);
router.post('/', requireAuth, upload.single('icon'), createCommunity);
router.put('/:slug', requireAuth, upload.single('icon'), updateCommunity);
router.get('/:slug/posts', getCommunityPosts);

export default router;
