import { Router } from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { uploadMedia } from '../middleware/upload';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, uploadMedia.single('avatar'), updateProfile);

export default router;
