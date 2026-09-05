import { Router } from 'express';
import { getProfile, updateProfile, addSkill, deleteSkill, addExperience, deleteExperience, updateExperience } from './profile.controller';
import { requireAuth } from '../../middleware/authHandler';

const router = Router();

router.use(requireAuth); // All profile routes are protected

router.get('/me', getProfile);
router.put('/me', updateProfile);

router.post('/skills', addSkill);
router.delete('/skills/:id', deleteSkill);

router.post('/experiences', addExperience);
router.put('/experiences/:id', updateExperience);
router.delete('/experiences/:id', deleteExperience);

export default router;
