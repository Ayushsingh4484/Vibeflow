import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { JamendoService } from '../services/jamendoService';
import { YouTubeService } from '../services/youtubeService';
import { ARTIST_CATALOG } from '../constants/artistCatalog';
import { ArtistMetadataService } from '../services/artistMetadataService';

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

    const [tracks, artists, albums, playlists, onlineTracks, youtubeTracks, catalogOrDynamicArtists] = await Promise.all([
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

      // Search YouTube catalog with YT_API_KEY
      YouTubeService.searchTracks(q, 10).catch(() => []),

      // Search catalog & dynamic artists with real YouTube Music photos
      (async () => {
        const enriched = await ArtistMetadataService.getEnrichedCatalog();
        const catalogMatches = enriched.filter((a) =>
          a.name.toLowerCase().includes(q.toLowerCase())
        );
        if (catalogMatches.length > 0) {
          return catalogMatches.map((c) => ({
            id: c.id,
            name: c.name,
            imageUrl: c.imageUrl,
            bio: c.bio,
            _count: { tracks: 15, albums: 3 },
          }));
        }
        if (q.length >= 3) {
          try {
            const meta = await ArtistMetadataService.getArtistMetadata(q);
            if (meta && meta.imageUrl) {
              return [
                {
                  id: meta.id,
                  name: meta.name,
                  imageUrl: meta.imageUrl,
                  bio: meta.bio,
                  _count: { tracks: 15, albums: 3 },
                },
              ];
            }
          } catch {
            return [];
          }
        }
        return [];
      })().catch(() => []),
    ]);

    const formattedLocalTracks = tracks.map((t: any) => ({
      ...t,
      source: t.id.startsWith('jamendo-') ? 'jamendo' : 'local',
      isLiked: userId ? (t.likedBy && t.likedBy.length > 0) : false,
      likedBy: undefined,
    }));

    // Combine online catalog tracks (YouTube + Jamendo)
    const combinedOnlineTracks: any[] = [...(youtubeTracks as any[]), ...(onlineTracks as any[])];

    // Check liked status for online tracks
    let formattedOnlineTracks = combinedOnlineTracks;
    if (userId && combinedOnlineTracks.length > 0) {
      const onlineIds = combinedOnlineTracks.map((t) => t.id);
      const liked = await prisma.likedTrack.findMany({
        where: {
          userId,
          trackId: { in: onlineIds },
        },
        select: { trackId: true },
      });
      const likedSet = new Set(liked.map((l) => l.trackId));
      formattedOnlineTracks = combinedOnlineTracks.map((t) => ({ ...t, isLiked: likedSet.has(t.id) }));
    }

    // Merge and deduplicate artists
    const allArtists = [...artists];
    for (const ca of (catalogOrDynamicArtists as any[])) {
      if (!allArtists.some((a) => a.name.toLowerCase() === ca.name.toLowerCase())) {
        allArtists.push(ca);
      }
    }

    // Top Result ranking
    let topResult: any = null;
    const matchedArtist = allArtists.find(
      (a) =>
        a.name.toLowerCase() === q.toLowerCase() ||
        a.name.toLowerCase().startsWith(q.toLowerCase())
    );
    if (matchedArtist) {
      topResult = { type: 'artist', data: matchedArtist };
    } else if (formattedLocalTracks.length > 0) {
      topResult = { type: 'track', data: formattedLocalTracks[0] };
    } else if (formattedOnlineTracks.length > 0) {
      topResult = { type: 'track', data: formattedOnlineTracks[0] };
    } else if (allArtists.length > 0) {
      topResult = { type: 'artist', data: allArtists[0] };
    } else if (albums.length > 0) {
      topResult = { type: 'album', data: albums[0] };
    } else if (playlists.length > 0) {
      topResult = { type: 'playlist', data: playlists[0] };
    }

    // Asynchronously record search in SearchHistory if user is logged in
    if (userId && q.length >= 2) {
      prisma.searchHistory
        .create({
          data: {
            userId,
            query: q,
          },
        })
        .catch((err) => console.warn('Failed to record search history:', err.message));
    }

    res.json({
      query: q,
      topResult,
      tracks: formattedLocalTracks,
      artists: allArtists,
      albums,
      playlists,
      onlineTracks: formattedOnlineTracks,
    });
  } catch (error: any) {
    console.error('searchCatalog error:', error);
    res.status(500).json({ error: 'Search operation failed.' });
  }
};

/**
 * Keyword suggestion while searching songs / artists
 */
export const getKeywordSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : '';
    if (!q) {
      res.json({ suggestions: [] });
      return;
    }

    // 1. Fetch suggestions from YouTube Music search complete API
    const ytPromise = YouTubeService.getSearchSuggestions(q, 8);

    // 2. Fetch local track/artist matches as instant suggestions
    const localTracksPromise = prisma.track.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { genre: { contains: q } },
        ],
      },
      take: 4,
      select: { title: true },
    });

    const localArtistsPromise = prisma.artist.findMany({
      where: { name: { contains: q } },
      take: 4,
      select: { name: true },
    });

    const [ytSuggestions, localTracks, localArtists] = await Promise.all([
      ytPromise.catch(() => []),
      localTracksPromise.catch(() => []),
      localArtistsPromise.catch(() => []),
    ]);

    // Deduplicate and combine suggestions
    const combinedSet = new Set<string>();

    localTracks.forEach((t) => {
      if (t.title) combinedSet.add(t.title);
    });

    localArtists.forEach((a) => {
      if (a.name) combinedSet.add(a.name);
    });

    ytSuggestions.forEach((s) => {
      if (s) combinedSet.add(s);
    });

    const suggestions = Array.from(combinedSet).slice(0, 8);

    res.json({ suggestions });
  } catch (err: any) {
    console.error('getKeywordSuggestions error:', err);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
};

/**
 * Get recent search history for user
 */
export const getSearchHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.json({ history: [] });
      return;
    }

    // Get latest distinct queries
    const records = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // Deduplicate preserving latest order
    const seen = new Set<string>();
    const history: { id: string; query: string; createdAt: Date }[] = [];

    for (const item of records) {
      const lower = item.query.toLowerCase().trim();
      if (!seen.has(lower)) {
        seen.add(lower);
        history.push({
          id: item.id,
          query: item.query,
          createdAt: item.createdAt,
        });
      }
      if (history.length >= 10) break;
    }

    res.json({ history });
  } catch (err: any) {
    console.error('getSearchHistory error:', err);
    res.status(500).json({ error: 'Failed to fetch search history' });
  }
};

/**
 * Add query to search history
 */
export const addSearchHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const query = req.body?.query ? String(req.body.query).trim() : '';

    if (!userId || !query) {
      res.status(400).json({ error: 'User ID and query are required' });
      return;
    }

    const item = await prisma.searchHistory.create({
      data: {
        userId,
        query,
      },
    });

    res.json({ success: true, item });
  } catch (err: any) {
    console.error('addSearchHistory error:', err);
    res.status(500).json({ error: 'Failed to record search history' });
  }
};

/**
 * Delete a specific search query or clear all history
 */
export const deleteSearchHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const historyId = String(id);

    if (historyId === 'all') {
      await prisma.searchHistory.deleteMany({
        where: { userId },
      });
      res.json({ success: true, message: 'All search history cleared' });
      return;
    }

    await prisma.searchHistory.deleteMany({
      where: {
        id: historyId,
        userId,
      },
    });

    res.json({ success: true, message: 'Search history entry deleted' });
  } catch (err: any) {
    console.error('deleteSearchHistory error:', err);
    res.status(500).json({ error: 'Failed to delete search history' });
  }
};
