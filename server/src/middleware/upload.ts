import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { AUDIO_DIR, ARTWORK_DIR, AVATAR_DIR } from '../services/storageService';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      cb(null, AUDIO_DIR);
    } else if (file.fieldname === 'avatar') {
      cb(null, AVATAR_DIR);
    } else {
      cb(null, ARTWORK_DIR);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const hash = crypto.randomBytes(8).toString('hex');
    const safeName = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    cb(null, `${Date.now()}-${safeName}-${hash}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const audioMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/ogg', 'audio/aac', 'audio/mp4', 'audio/x-m4a'];
  const imageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

  if (file.fieldname === 'audio') {
    if (audioMimes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|flac|ogg|aac|m4a)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file format. Allowed: MP3, WAV, FLAC, OGG, AAC, M4A'));
    }
  } else {
    if (imageMimes.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image file format. Allowed: JPG, PNG, WEBP, SVG'));
    }
  }
};

export const uploadMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max per file
  },
});
