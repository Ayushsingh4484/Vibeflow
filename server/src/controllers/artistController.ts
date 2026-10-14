import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { StorageService } from '../services/storageService';
import { ARTIST_CATALOG } from '../constants/artistCatalog';
import { YouTubeService } from '../services/youtubeService';
import { ArtistMetadataService } from '../services/artistMetadataService';

export const getArtists = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '50', search } = req.query;
    const where: any = {};
    if (search) {
      where.name = { contains: String(search) };
    }

    const artists = await prisma.artist.findMany({
      where,
      take: parseInt(String(limit), 10),
      include: {
        _count: {
          select: { tracks: true, albums: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ artists });
  } catch (error: any) {
    console.error('getArtists error:', error);
    res.status(500).json({ error: 'Failed to fetch artists.' });
  }
};

export const getArtistById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;

    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        albums: {
          include: {
            tracks: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        tracks: {
          take: 20,
          orderBy: { playCount: 'desc' },
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
        },
      },
    });

    if (!artist) {
      res.status(404).json({ error: 'Artist not found.' });
      return;
    }

    const artistWithData = artist as any;
    const formattedTracks = (artistWithData.tracks || []).map((track: any) => ({
      ...track,
      isLiked: userId ? (track.likedBy && track.likedBy.length > 0) : false,
      likedBy: undefined,
    }));

    res.json({ artist: { ...artist, tracks: formattedTracks } });
  } catch (error: any) {
    console.error('getArtistById error:', error);
    res.status(500).json({ error: 'Failed to fetch artist details.' });
  }
};

export const createArtist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, bio, imageUrl: bodyImageUrl } = req.body;
    const file = req.file;

    if (!name) {
      res.status(400).json({ error: 'Artist name is required.' });
      return;
    }

    let imageUrl = bodyImageUrl;
    if (file) {
      imageUrl = StorageService.getPublicUrl('artwork', file.filename);
    }
    if (!imageUrl) {
      imageUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(String(name))}`;
    }

    const artist = await prisma.artist.create({
      data: {
        name: String(name).trim(),
        bio: bio ? String(bio).trim() : null,
        imageUrl,
      },
    });

    res.status(201).json({ artist });
  } catch (error: any) {
    console.error('createArtist error:', error);
    res.status(500).json({ error: 'Failed to create artist.' });
  }
};

export const updateArtist = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name, bio, imageUrl: bodyImageUrl } = req.body;
    const file = req.file;

    let imageUrl = bodyImageUrl;
    if (file) {
      imageUrl = StorageService.getPublicUrl('artwork', file.filename);
    }

    const artist = await prisma.artist.update({
      where: { id },
      data: {
        name: name ? String(name).trim() : undefined,
        bio: bio !== undefined ? (bio ? String(bio).trim() : null) : undefined,
        imageUrl: imageUrl || undefined,
      },
    });

    res.json({ artist });
  } catch (error: any) {
    console.error('updateArtist error:', error);
    res.status(500).json({ error: 'Failed to update artist.' });
  }
};

export const deleteArtist = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.artist.delete({ where: { id } });
    res.json({ success: true, message: 'Artist deleted successfully.' });
  } catch (error: any) {
    console.error('deleteArtist error:', error);
    res.status(500).json({ error: 'Failed to delete artist.' });
  }
};

/**
 * GET /api/artists/catalog
 * Returns curated Indian & International artists with categories and images
 */
export const getArtistCatalog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, region, search } = req.query;
    let artists = await ArtistMetadataService.getEnrichedCatalog();

    if (category && typeof category === 'string' && category !== 'All') {
      artists = artists.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }

    if (region && typeof region === 'string' && region !== 'All') {
      artists = artists.filter((a) => a.region.toLowerCase() === region.toLowerCase());
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      artists = artists.filter(
        (a) => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
      );

      // If user searched for an artist outside of catalog, fetch metadata dynamically!
      if (artists.length === 0 && q.length >= 2) {
        try {
          const dynamicMeta = await ArtistMetadataService.getArtistMetadata(q);
          if (dynamicMeta && dynamicMeta.imageUrl) {
            artists = [
              {
                id: dynamicMeta.id,
                name: dynamicMeta.name,
                category: (dynamicMeta.category as any) || 'Pop',
                region: (dynamicMeta.region as any) || 'International',
                bio: dynamicMeta.bio || `Explore music by ${dynamicMeta.name}`,
                imageUrl: dynamicMeta.imageUrl,
                monthlyListeners: dynamicMeta.monthlyListeners || '10M+',
                browseId: dynamicMeta.browseId,
              },
            ];
          }
        } catch {
          // ignore fallback
        }
      }
    }

    res.json({ artists });
  } catch (error: any) {
    console.error('getArtistCatalog error:', error);
    res.status(500).json({ error: 'Failed to fetch artist catalog.' });
  }
};

/**
 * GET /api/artists/details/:query
 * Fetches dynamic artist profile, YouTube popular tracks, and official playlists
 */
export const getDynamicArtistDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = decodeURIComponent(String(req.params.query || '')).trim();
    if (!query) {
      res.status(400).json({ error: 'Artist name or query is required' });
      return;
    }

    // Fetch normalized artist metadata with real YouTube Music photo
    const metadata = await ArtistMetadataService.getArtistMetadata(query);

    // Fetch songs and official playlists in parallel via YouTubeService
    const [ytTracks, ytPlaylists] = await Promise.all([
      YouTubeService.searchTracks(`${metadata.name} official song`, 15).catch(() => []),
      YouTubeService.searchArtistPlaylists(metadata.name, 8).catch(() => []),
    ]);

    // Format songs into artist format with real artist portrait
    const formattedTracks = ytTracks.map((t) => ({
      ...t,
      artist: {
        id: metadata.id,
        name: metadata.name,
        imageUrl: metadata.imageUrl,
      },
    }));

    res.json({
      artist: {
        id: metadata.id,
        name: metadata.name,
        bio: metadata.bio,
        imageUrl: metadata.imageUrl,
        browseId: metadata.browseId,
        category: metadata.category || 'Music',
        region: metadata.region || 'International',
        monthlyListeners: metadata.monthlyListeners || '10M+',
        tracks: formattedTracks,
        playlists: ytPlaylists,
        albums: [],
      },
    });
  } catch (error: any) {
    console.error('getDynamicArtistDetails error:', error);
    res.status(500).json({ error: 'Failed to fetch dynamic artist details.' });
  }
};

/**
 * GET /api/artists/playlist/:id
 * Fetches tracks belonging to an artist YouTube playlist
 */
export const getArtistPlaylistTracks = async (req: Request, res: Response): Promise<void> => {
  try {
    const playlistId = String(req.params.id);
    if (!playlistId) {
      res.status(400).json({ error: 'Playlist ID is required' });
      return;
    }

    const tracks = await YouTubeService.getPlaylistTracks(playlistId, 25);
    res.json({ tracks });
  } catch (error: any) {
    console.error('getArtistPlaylistTracks error:', error);
    res.status(500).json({ error: 'Failed to fetch playlist tracks.' });
  }
};
