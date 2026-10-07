import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../config/prisma';
import { AUDIO_DIR } from '../services/storageService';
import { streamAudioFile } from '../utils/audioStream';

const router = Router();

// Stream by track ID
router.get('/track/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const track = await prisma.track.findUnique({ where: { id } });

    if (!track) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }

    if (track.audioUrl.startsWith('http://') || track.audioUrl.startsWith('https://')) {
      if (track.audioUrl.includes('/uploads/audio/')) {
        const filename = track.audioUrl.split('/uploads/audio/')[1];
        const localPath = path.join(AUDIO_DIR, filename);
        if (fs.existsSync(localPath)) {
          streamAudioFile(req, res, localPath);
          return;
        }
      }
      res.redirect(track.audioUrl);
      return;
    }

    const localPath = path.join(AUDIO_DIR, track.audioUrl);
    streamAudioFile(req, res, localPath);
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Streaming failed' });
  }
});

// Stream by direct audio filename
router.get('/file/:filename', (req: Request, res: Response): void => {
  const filename = String(req.params.filename);
  const safeFilename = path.basename(filename);
  const localPath = path.join(AUDIO_DIR, safeFilename);

  if (!fs.existsSync(localPath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  streamAudioFile(req, res, localPath);
});

export default router;
