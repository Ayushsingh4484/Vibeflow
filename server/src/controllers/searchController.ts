import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { JamendoService } from '../services/jamendoService';

export const searchCatalog = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : '';
    const userId = req.user?.id;

    if (!q) {
      res.json({
        query: '',
        topResult: null,
        tracks: [],
        artists: [],
        albums: [],
        playlists: [],
        onlineTracks: [],
      });
      return;
    }

    const [tracks, artists, albums, playlists, onlineTracks] = await Promise.all([
      // Search local tracks
      prisma.track.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { genre: { contains: q } },
            { artist: { name: { contains: q } } },
          ],
        },
        take: 10,
        include: {
          artist: { select: { id: true, name: true } },
          album: { select: { id: true, title: true, coverUrl: true } },
          ...(userId
            ? {
                likedBy: {
                  where: { userId },
                  select: { userId: true },
                },
              }
            : {}),
        },
        orderBy: { playCount: 'desc' },
      }),

      // Search local artists
      prisma.artist.findMany({
        where: {
          name: { contains: q },
        },
        take: 8,
        include: {
          _count: { select: { tracks: true, albums: true } },
        },
      }),

      // Search local albums
      prisma.album.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { artist: { name: { contains: q } } },
          ],
        },
        take: 8,
        include: {
          artist: { select: { id: true, name: true } },
          _count: { select: { tracks: true } },
        },
      }),

      // Search playlists
      prisma.playlist.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
          ],
        },
        take: 8,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { tracks: true } },
        },
      }),

      // Search Jamendo online catalog
      JamendoService.searchTracks(q, 10).catch(() => []),
    ]);

    const formattedLocalTracks = tracks.map((t: any) => ({
      ...t,
      source: t.id.startsWith('jamendo-') ? 'jamendo' : 'local',
      isLiked: userId ? (t.likedBy && t.likedBy.length > 0) : false,
      likedBy: undefined,
    }));

    // Check liked status for online Jamendo tracks
    let formattedOnlineTracks = onlineTracks;
    if (userId && onlineTracks.length > 0) {
      const jamendoIds = onlineTracks.map((t) => t.id);
      const liked = await prisma.likedTrack.findMany({
        where: {
          userId,
          trackId: { in: jamendoIds },
        },
        select: { trackId: true },
      });
      const likedSet = new Set(liked.map((l) => l.trackId));
      formattedOnlineTracks = onlineTracks.map((t) => ({ ...t, isLiked: likedSet.has(t.id) }));
    }

    // Top Result ranking
    let topResult: any = null;
    const exactArtist = artists.find((a) => a.name.toLowerCase() === q.toLowerCase());
    if (exactArtist) {
      topResult = { type: 'artist', data: exactArtist };
    } else if (formattedLocalTracks.length > 0) {
      topResult = { type: 'track', data: formattedLocalTracks[0] };
    } else if (formattedOnlineTracks.length > 0) {
      topResult = { type: 'track', data: formattedOnlineTracks[0] };
    } else if (artists.length > 0) {
      topResult = { type: 'artist', data: artists[0] };
    } else if (albums.length > 0) {
      topResult = { type: 'album', data: albums[0] };
    } else if (playlists.length > 0) {
      topResult = { type: 'playlist', data: playlists[0] };
    }

    res.json({
      query: q,
      topResult,
      tracks: formattedLocalTracks,
      artists,
      albums,
      playlists,
      onlineTracks: formattedOnlineTracks,
    });
  } catch (error: any) {
    console.error('searchCatalog error:', error);
    res.status(500).json({ error: 'Search operation failed.' });
  }
};
