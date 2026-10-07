import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { StorageService } from '../services/storageService';

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
