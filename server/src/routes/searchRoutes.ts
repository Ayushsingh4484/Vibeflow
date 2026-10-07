import { Router } from 'express';
import { searchCatalog } from '../controllers/searchController';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuthenticate, searchCatalog);

export default router;
