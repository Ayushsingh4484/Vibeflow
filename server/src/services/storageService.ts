import path from 'path';
import fs from 'fs';
import { ENV } from '../config/env';

export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
export const AUDIO_DIR = path.join(UPLOADS_DIR, 'audio');
export const ARTWORK_DIR = path.join(UPLOADS_DIR, 'artwork');
export const AVATAR_DIR = path.join(UPLOADS_DIR, 'avatars');

// Ensure upload directories exist
[UPLOADS_DIR, AUDIO_DIR, ARTWORK_DIR, AVATAR_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export class StorageService {
  public static getPublicUrl(category: 'audio' | 'artwork' | 'avatars', filename: string): string {
    if (!filename) return '';
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    return `${ENV.STORAGE_BASE_URL}/${category}/${filename}`;
  }

  public static deleteFile(category: 'audio' | 'artwork' | 'avatars', filename: string): void {
    if (!filename || filename.startsWith('http://') || filename.startsWith('https://')) return;
    const filePath = path.join(UPLOADS_DIR, category, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to delete file: ${filePath}`, err);
      }
    }
  }
}
