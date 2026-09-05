import { Router } from 'express';
import { multiFieldSearch } from '../modules/search/search.controller';

const router = Router();

router.get('/', multiFieldSearch);

export default router;
