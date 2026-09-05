import { Router } from 'express';
import { multiFieldSearch } from './search.controller';

const router = Router();

router.get('/', multiFieldSearch);

export default router;
