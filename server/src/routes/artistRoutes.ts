import { Router } from 'express';
import {
  getArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist,
} from '../controllers/artistController';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth';
import { uploadMedia } from '../middleware/upload';

const router = Router();

router.get('/', getArtists);
router.get('/:id', optionalAuthenticate, getArtistById);
router.post('/', authenticate, requireAdmin, uploadMedia.single('image'), createArtist);
router.put('/:id', authenticate, requireAdmin, uploadMedia.single('image'), updateArtist);
router.delete('/:id', authenticate, requireAdmin, deleteArtist);

export default router;
