import { Router } from 'express';
import {
  getJamendoTracks,
  getPopularJamendoTracks,
  searchJamendo,
  getJamendoGenre,
  getJamendoTrackById,
} from '../controllers/jamendoController';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.use(optionalAuthenticate);

router.get('/tracks', getJamendoTracks);
router.get('/popular', getPopularJamendoTracks);
router.get('/search', searchJamendo);
router.get('/genre/:genre', getJamendoGenre);
router.get('/tracks/:id', getJamendoTrackById);

export default router;
