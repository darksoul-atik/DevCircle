import { Router } from 'express';
import { getProfile, updateProfile, addSkill, deleteSkill, addExperience, deleteExperience, updateExperience, getPublicProfile } from './profile.controller';
import { requireAuth } from '../../middleware/authHandler';

const router = Router();

// Public route for viewing a user's profile
router.get('/user/:id', getPublicProfile);

router.use(requireAuth); // Protect all below routes

router.get('/me', getProfile);
router.put('/me', updateProfile);

router.post('/skills', addSkill);
router.delete('/skills/:id', deleteSkill);

router.post('/experiences', addExperience);
router.put('/experiences/:id', updateExperience);
router.delete('/experiences/:id', deleteExperience);

export default router;
