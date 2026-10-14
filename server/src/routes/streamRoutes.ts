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

// Memory cache for proxied image buffers (max 200 images)
const imageBufferCache = new Map<string, { buffer: Buffer; contentType: string; expiresAt: number }>();

// Proxy upstream images with caching, CORS, and anti-hotlinking headers
router.get('/image', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawUrl = String(req.query.url || '').trim();
    if (!rawUrl || (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://'))) {
      res.status(400).json({ error: 'Valid image URL is required' });
      return;
    }

    const parsed = new URL(rawUrl);
    const allowedHosts = [
      'googleusercontent.com',
      'ggpht.com',
      'ytimg.com',
      'youtube.com',
      'jamendo.com',
      'unsplash.com',
      'dicebear.com',
    ];
    const isAllowed = allowedHosts.some((h) => parsed.hostname.endsWith(h));
    if (!isAllowed) {
      res.status(403).json({ error: 'Host not allowed for image proxy' });
      return;
    }

    // Check buffer cache
    const cached = imageBufferCache.get(rawUrl);
    if (cached && Date.now() < cached.expiresAt) {
      res.set('Content-Type', cached.contentType);
      res.set('Cache-Control', 'public, max-age=604800, immutable');
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.send(cached.buffer);
      return;
    }

    const upstreamRes = await fetch(rawUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    if (!upstreamRes.ok) {
      res.status(upstreamRes.status).json({ error: 'Failed to fetch upstream image' });
      return;
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await upstreamRes.arrayBuffer());

    // Cache image for 7 days
    if (imageBufferCache.size > 200) {
      const firstKey = imageBufferCache.keys().next().value;
      if (firstKey) imageBufferCache.delete(firstKey);
    }
    imageBufferCache.set(rawUrl, { buffer, contentType, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=604800, immutable');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.send(buffer);
  } catch (error: any) {
    console.error('Image proxy error:', error.message);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

export default router;
