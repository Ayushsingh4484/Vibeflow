import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getRecentlyPlayed = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { limit = '20' } = req.query;

    const recent = await prisma.recentlyPlayed.findMany({
      where: { userId },
      take: parseInt(String(limit), 10) * 2, // fetch slightly more to deduplicate by track
      orderBy: { playedAt: 'desc' },
      include: {
        track: {
          include: {
            artist: { select: { id: true, name: true, imageUrl: true } },
            album: { select: { id: true, title: true, coverUrl: true } },
            likedBy: {
              where: { userId },
              select: { userId: true },
            },
          },
        },
      },
    });

    // Deduplicate tracks preserving latest playedAt
    const seen = new Set<string>();
    const deduplicatedTracks: any[] = [];

    for (const item of recent) {
      if (item.track && !seen.has(item.trackId)) {
        seen.add(item.trackId);
        deduplicatedTracks.push({
          ...item.track,
          playedAt: item.playedAt,
          isLiked: item.track.likedBy && item.track.likedBy.length > 0,
          likedBy: undefined,
        });
        if (deduplicatedTracks.length >= parseInt(String(limit), 10)) break;
      }
    }

    res.json({ tracks: deduplicatedTracks });
  } catch (error: any) {
    console.error('getRecentlyPlayed error:', error);
    res.status(500).json({ error: 'Failed to fetch recently played tracks.' });
  }
};

export const getLikedTracks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const liked = await prisma.likedTrack.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        track: {
          include: {
            artist: { select: { id: true, name: true, imageUrl: true } },
            album: { select: { id: true, title: true, coverUrl: true } },
          },
        },
      },
    });

    const tracks = liked.map((item) => ({
      ...item.track,
      likedAt: item.createdAt,
      isLiked: true,
    }));

    res.json({ tracks, total: tracks.length });
  } catch (error: any) {
    console.error('getLikedTracks error:', error);
    res.status(500).json({ error: 'Failed to fetch liked tracks.' });
  }
};
