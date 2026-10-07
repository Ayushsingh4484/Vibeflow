import { Router } from 'express';
import {
  getTracks,
  getTrackById,
  createTrack,
  updateTrack,
  deleteTrack,
  likeTrack,
  unlikeTrack,
  recordPlay,
} from '../controllers/trackController';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth';
import { uploadMedia } from '../middleware/upload';

const router = Router();

router.get('/', optionalAuthenticate, getTracks);
router.get('/:id', optionalAuthenticate, getTrackById);
router.post(
  '/',
  authenticate,
  requireAdmin,
  uploadMedia.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  createTrack
);
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  uploadMedia.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  updateTrack
);
router.delete('/:id', authenticate, requireAdmin, deleteTrack);

// Like / Unlike & Play tracking
router.post('/:id/like', authenticate, likeTrack);
router.delete('/:id/like', authenticate, unlikeTrack);
router.post('/:id/play', optionalAuthenticate, recordPlay);

export default router;
