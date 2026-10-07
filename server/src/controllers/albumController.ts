import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { StorageService } from '../services/storageService';

export const getAlbums = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '50', search, artistId } = req.query;
    const where: any = {};
    if (search) {
      where.title = { contains: String(search) };
    }
    if (artistId) {
      where.artistId = String(artistId);
    }

    const albums = await prisma.album.findMany({
      where,
      take: parseInt(String(limit), 10),
      include: {
        artist: { select: { id: true, name: true, imageUrl: true } },
        _count: { select: { tracks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ albums });
  } catch (error: any) {
    console.error('getAlbums error:', error);
    res.status(500).json({ error: 'Failed to fetch albums.' });
  }
};

export const getAlbumById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;

    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        artist: true,
        tracks: {
          orderBy: { trackNumber: 'asc' },
          include: {
            artist: { select: { id: true, name: true } },
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

    if (!album) {
      res.status(404).json({ error: 'Album not found.' });
      return;
    }

    const albumWithTracks = album as any;
    const formattedTracks = (albumWithTracks.tracks || []).map((track: any) => ({
      ...track,
      isLiked: userId ? (track.likedBy && track.likedBy.length > 0) : false,
      likedBy: undefined,
    }));

    const totalDuration = formattedTracks.reduce((acc: number, t: any) => acc + (t.duration || 0), 0);

    res.json({ album: { ...album, tracks: formattedTracks, totalDuration } });
  } catch (error: any) {
    console.error('getAlbumById error:', error);
    res.status(500).json({ error: 'Failed to fetch album details.' });
  }
};

export const createAlbum = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, artistId, releaseDate, coverUrl: bodyCoverUrl } = req.body;
    const file = req.file;

    if (!title || !artistId) {
      res.status(400).json({ error: 'Album title and artistId are required.' });
      return;
    }

    let coverUrl = bodyCoverUrl;
    if (file) {
      coverUrl = StorageService.getPublicUrl('artwork', file.filename);
    }

    const album = await prisma.album.create({
      data: {
        title: String(title).trim(),
        artistId: String(artistId),
        releaseDate: releaseDate || new Date().toISOString().split('T')[0],
        coverUrl: coverUrl || null,
      },
      include: {
        artist: true,
      },
    });

    res.status(201).json({ album });
  } catch (error: any) {
    console.error('createAlbum error:', error);
    res.status(500).json({ error: 'Failed to create album.' });
  }
};

export const updateAlbum = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { title, artistId, releaseDate, coverUrl: bodyCoverUrl } = req.body;
    const file = req.file;

    let coverUrl = bodyCoverUrl;
    if (file) {
      coverUrl = StorageService.getPublicUrl('artwork', file.filename);
    }

    const album = await prisma.album.update({
      where: { id },
      data: {
        title: title ? String(title).trim() : undefined,
        artistId: artistId ? String(artistId) : undefined,
        releaseDate: releaseDate || undefined,
        coverUrl: coverUrl || undefined,
      },
      include: {
        artist: true,
      },
    });

    res.json({ album });
  } catch (error: any) {
    console.error('updateAlbum error:', error);
    res.status(500).json({ error: 'Failed to update album.' });
  }
};

export const deleteAlbum = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.album.delete({ where: { id } });
    res.json({ success: true, message: 'Album deleted successfully.' });
  } catch (error: any) {
    console.error('deleteAlbum error:', error);
    res.status(500).json({ error: 'Failed to delete album.' });
  }
};
