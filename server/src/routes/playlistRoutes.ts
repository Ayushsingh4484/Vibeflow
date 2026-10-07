import { Router } from 'express';
import {
  getPlaylists,
  getUserPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderTracks,
} from '../controllers/playlistController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { uploadMedia } from '../middleware/upload';

const router = Router();

router.get('/', getPlaylists);
router.get('/user/me', authenticate, getUserPlaylists);
router.get('/:id', optionalAuthenticate, getPlaylistById);
router.post('/', authenticate, uploadMedia.single('cover'), createPlaylist);
router.put('/:id', authenticate, uploadMedia.single('cover'), updatePlaylist);
router.delete('/:id', authenticate, deletePlaylist);

// Tracks inside playlist
router.post('/:id/tracks', authenticate, addTrackToPlaylist);
router.delete('/:id/tracks/:trackId', authenticate, removeTrackFromPlaylist);
router.put('/:id/reorder', authenticate, reorderTracks);

export default router;
