import { Request, Response } from 'express';
import { JamendoService } from '../services/jamendoService';
import prisma from '../config/prisma';

export const getJamendoTracks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '20', offset = '0', tags, search } = req.query;
    const userId = req.user?.id;

    let tracks = [];
    if (search) {
      tracks = await JamendoService.searchTracks(String(search), parseInt(String(limit), 10));
    } else if (tags) {
      tracks = await JamendoService.getTracksByGenre(String(tags), parseInt(String(limit), 10));
    } else {
      tracks = await JamendoService.getPopularTracks(parseInt(String(limit), 10), parseInt(String(offset), 10));
    }

    // Check liked status for user
    if (userId && tracks.length > 0) {
      const trackIds = tracks.map((t) => t.id);
      const liked = await prisma.likedTrack.findMany({
        where: {
          userId,
          trackId: { in: trackIds },
        },
        select: { trackId: true },
      });
      const likedSet = new Set(liked.map((l) => l.trackId));
      tracks = tracks.map((t) => ({ ...t, isLiked: likedSet.has(t.id) }));
    }

    res.json({ tracks, total: tracks.length, source: 'jamendo' });
  } catch (error: any) {
    console.error('getJamendoTracks error:', error);
    res.status(500).json({ error: 'Failed to fetch Jamendo tracks', tracks: [] });
  }
};

export const getPopularJamendoTracks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '20', offset = '0' } = req.query;
    const userId = req.user?.id;

    let tracks = await JamendoService.getPopularTracks(
      parseInt(String(limit), 10),
      parseInt(String(offset), 10)
    );

    if (userId && tracks.length > 0) {
      const trackIds = tracks.map((t) => t.id);
      const liked = await prisma.likedTrack.findMany({
        where: {
          userId,
          trackId: { in: trackIds },
        },
        select: { trackId: true },
      });
      const likedSet = new Set(liked.map((l) => l.trackId));
      tracks = tracks.map((t) => ({ ...t, isLiked: likedSet.has(t.id) }));
    }

    res.json({ tracks, total: tracks.length, source: 'jamendo' });
  } catch (error: any) {
    console.error('getPopularJamendoTracks error:', error);
    res.status(500).json({ error: 'Failed to fetch popular Jamendo tracks', tracks: [] });
  }
};

export const searchJamendo = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : '';
    const { limit = '20' } = req.query;
    const userId = req.user?.id;

    if (!q) {
      res.json({ query: '', tracks: [], total: 0, source: 'jamendo' });
      return;
    }

    let tracks = await JamendoService.searchTracks(q, parseInt(String(limit), 10));

    if (userId && tracks.length > 0) {
      const trackIds = tracks.map((t) => t.id);
      const liked = await prisma.likedTrack.findMany({
        where: {
          userId,
          trackId: { in: trackIds },
        },
        select: { trackId: true },
      });
      const likedSet = new Set(liked.map((l) => l.trackId));
      tracks = tracks.map((t) => ({ ...t, isLiked: likedSet.has(t.id) }));
    }

    res.json({ query: q, tracks, total: tracks.length, source: 'jamendo' });
  } catch (error: any) {
    console.error('searchJamendo error:', error);
    res.status(500).json({ error: 'Failed to search Jamendo tracks', tracks: [] });
  }
};

export const getJamendoGenre = async (req: Request, res: Response): Promise<void> => {
  try {
    const genre = String(req.params.genre);
    const { limit = '20' } = req.query;
    const userId = req.user?.id;

    let tracks = await JamendoService.getTracksByGenre(genre, parseInt(String(limit), 10));

    if (userId && tracks.length > 0) {
      const trackIds = tracks.map((t) => t.id);
      const liked = await prisma.likedTrack.findMany({
        where: {
          userId,
          trackId: { in: trackIds },
        },
        select: { trackId: true },
      });
      const likedSet = new Set(liked.map((l) => l.trackId));
      tracks = tracks.map((t) => ({ ...t, isLiked: likedSet.has(t.id) }));
    }

    res.json({ genre, tracks, total: tracks.length, source: 'jamendo' });
  } catch (error: any) {
    console.error('getJamendoGenre error:', error);
    res.status(500).json({ error: 'Failed to fetch tracks by genre', tracks: [] });
  }
};

export const getJamendoTrackById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;

    const track = await JamendoService.getTrackById(id);
    if (!track) {
      res.status(404).json({ error: 'Jamendo track not found' });
      return;
    }

    let isLiked = false;
    if (userId) {
      const liked = await prisma.likedTrack.findUnique({
        where: {
          userId_trackId: {
            userId,
            trackId: track.id,
          },
        },
      });
      isLiked = !!liked;
    }

    res.json({ track: { ...track, isLiked } });
  } catch (error: any) {
    console.error('getJamendoTrackById error:', error);
    res.status(500).json({ error: 'Failed to fetch track' });
  }
};
