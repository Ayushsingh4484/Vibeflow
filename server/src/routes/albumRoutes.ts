import { Router } from 'express';
import {
  getAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
} from '../controllers/albumController';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth';
import { uploadMedia } from '../middleware/upload';

const router = Router();

router.get('/', getAlbums);
router.get('/:id', optionalAuthenticate, getAlbumById);
router.post('/', authenticate, requireAdmin, uploadMedia.single('cover'), createAlbum);
router.put('/:id', authenticate, requireAdmin, uploadMedia.single('cover'), updateAlbum);
router.delete('/:id', authenticate, requireAdmin, deleteAlbum);

export default router;
