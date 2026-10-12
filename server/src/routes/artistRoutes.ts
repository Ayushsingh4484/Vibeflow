import { Router } from 'express';
import {
  getArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist,
  getArtistCatalog,
  getDynamicArtistDetails,
  getArtistPlaylistTracks,
} from '../controllers/artistController';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth';
import { uploadMedia } from '../middleware/upload';

const router = Router();

// Catalog & Dynamic YouTube Artist Routes
router.get('/catalog', getArtistCatalog);
router.get('/details/:query', getDynamicArtistDetails);
router.get('/playlist/:id', getArtistPlaylistTracks);

// Database Artist Routes
router.get('/', getArtists);
router.get('/:id', optionalAuthenticate, getArtistById);
router.post('/', authenticate, requireAdmin, uploadMedia.single('image'), createArtist);
router.put('/:id', authenticate, requireAdmin, uploadMedia.single('image'), updateArtist);
router.delete('/:id', authenticate, requireAdmin, deleteArtist);

export default router;
