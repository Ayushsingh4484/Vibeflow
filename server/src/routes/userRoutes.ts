import { Router } from 'express';
import { getRecentlyPlayed, getLikedTracks } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/recently-played', authenticate, getRecentlyPlayed);
router.get('/liked-tracks', authenticate, getLikedTracks);

export default router;
