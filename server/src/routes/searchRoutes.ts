import { Router } from 'express';
import {
  searchCatalog,
  getKeywordSuggestions,
  getSearchHistory,
  addSearchHistory,
  deleteSearchHistory,
} from '../controllers/searchController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuthenticate, searchCatalog);
router.get('/suggestions', getKeywordSuggestions);
router.get('/history', authenticate, getSearchHistory);
router.post('/history', authenticate, addSearchHistory);
router.delete('/history/:id', authenticate, deleteSearchHistory);

export default router;
