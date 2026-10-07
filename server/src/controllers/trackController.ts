import { Request, Response } from 'express';
import * as musicMetadata from 'music-metadata';
import path from 'path';
import prisma from '../config/prisma';
import { StorageService, AUDIO_DIR } from '../services/storageService';
import { JamendoService } from '../services/jamendoService';

// Helper to ensure a Jamendo track exists in the DB for relational likes/playlists/history
async function ensureTrackExists(trackId: string, trackData?: any) {
  let coverUrl = trackData?.artworkUrl || trackData?.coverUrl || null;

  let existing = await prisma.track.findUnique({ where: { id: trackId } });
  if (existing) {
    if ((!existing.coverUrl || existing.coverUrl.includes('width=300')) && coverUrl) {
      existing = await prisma.track.update({
        where: { id: trackId },
        data: { coverUrl },
      });
    }
    return existing;
  }

  let title = trackData?.title || 'Jamendo Track';
  let artistName = trackData?.artist?.name || trackData?.artistName || 'Jamendo Artist';
  let audioUrl = trackData?.audioUrl || '';
  let duration = trackData?.duration || 180;
  let genre = trackData?.genre || 'Creative Commons';

  if ((!audioUrl || !coverUrl) && trackId.startsWith('jamendo-')) {
    const remote = await JamendoService.getTrackById(trackId);
    if (remote) {
      title = remote.title;
      artistName = remote.artist?.name || artistName;
      audioUrl = remote.audioUrl;
      coverUrl = remote.artworkUrl || remote.coverUrl || null;
      duration = remote.duration;
      genre = remote.genre || genre;
    }
  }

  if (!audioUrl) return null;

  // Find or create artist
  let artist = await prisma.artist.findFirst({
    where: { name: { equals: artistName.trim() } },
  });
  if (!artist) {
    artist = await prisma.artist.create({
      data: {
        name: artistName.trim(),
        imageUrl: coverUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(artistName)}`,
      },
    });
  }

  // Create track in DB
  return await prisma.track.create({
    data: {
      id: trackId,
      title,
      artistId: artist.id,
      audioUrl,
      coverUrl,
      duration,
      genre,
    },
  });
}

export const getTracks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { genre, artistId, albumId, search, limit = '50', offset = '0', sort = 'newest' } = req.query;
    const userId = req.user?.id;

    const where: any = {};
    if (genre) where.genre = String(genre);
    if (artistId) where.artistId = String(artistId);
    if (albumId) where.albumId = String(albumId);
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { artist: { name: { contains: String(search) } } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'popular') orderBy = { playCount: 'desc' };
    if (sort === 'title') orderBy = { title: 'asc' };

    const [tracks, total] = await Promise.all([
      prisma.track.findMany({
        where,
        take: parseInt(String(limit), 10),
        skip: parseInt(String(offset), 10),
        orderBy,
        include: {
          artist: { select: { id: true, name: true, imageUrl: true } },
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
      }),
      prisma.track.count({ where }),
    ]);

    const formattedTracks = tracks.map((track: any) => ({
      ...track,
      source: track.id.startsWith('jamendo-') ? 'jamendo' : 'local',
      isLiked: userId ? (track.likedBy && track.likedBy.length > 0) : false,
      likedBy: undefined,
    }));

    res.json({ tracks: formattedTracks, total });
  } catch (error: any) {
    console.error('getTracks error:', error);
    res.status(500).json({ error: 'Failed to fetch tracks.' });
  }
};

export const getTrackById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;

    // Check Jamendo first if ID has jamendo prefix
    if (id.startsWith('jamendo-')) {
      const jamendoTrack = await JamendoService.getTrackById(id);
      if (jamendoTrack) {
        let isLiked = false;
        if (userId) {
          const liked = await prisma.likedTrack.findUnique({
            where: { userId_trackId: { userId, trackId: id } },
          });
          isLiked = !!liked;
        }
        res.json({ track: { ...jamendoTrack, isLiked } });
        return;
      }
    }

    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        artist: {
          include: {
            tracks: {
              where: { id: { not: id } },
              take: 5,
              include: {
                artist: { select: { id: true, name: true } },
              },
            },
          },
        },
        album: {
          include: {
            tracks: true,
          },
        },
        ...(userId
          ? {
              likedBy: {
                where: { userId },
                select: { userId: true },
              },
            }
          : {}),
      },
    });

    if (!track) {
      res.status(404).json({ error: 'Track not found.' });
      return;
    }

    const trackData = track as any;
    const formattedTrack = {
      ...track,
      source: track.id.startsWith('jamendo-') ? 'jamendo' : 'local',
      isLiked: userId ? (trackData.likedBy && trackData.likedBy.length > 0) : false,
      likedBy: undefined,
    };

    res.json({ track: formattedTrack });
  } catch (error: any) {
    console.error('getTrackById error:', error);
    res.status(500).json({ error: 'Failed to fetch track.' });
  }
};

export const createTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const audioFile = files?.['audio']?.[0];
    const coverFile = files?.['cover']?.[0];

    const {
      title,
      artistId,
      artistName,
      albumId,
      albumTitle,
      genre,
      trackNumber,
      coverUrl: bodyCoverUrl,
      audioUrl: bodyAudioUrl,
    } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Track title is required.' });
      return;
    }

    let audioUrl = bodyAudioUrl ? String(bodyAudioUrl) : '';
    let duration = parseFloat(req.body.duration || '0');

    if (audioFile) {
      audioUrl = StorageService.getPublicUrl('audio', audioFile.filename);
      try {
        const metadata = await musicMetadata.parseFile(path.join(AUDIO_DIR, audioFile.filename));
        if (metadata.format.duration && duration === 0) {
          duration = metadata.format.duration;
        }
      } catch (err) {
        console.warn('Could not extract duration with music-metadata:', err);
      }
    }

    if (!audioUrl) {
      res.status(400).json({ error: 'Audio file or audioUrl is required.' });
      return;
    }

    let coverUrl = bodyCoverUrl ? String(bodyCoverUrl) : null;
    if (coverFile) {
      coverUrl = StorageService.getPublicUrl('artwork', coverFile.filename);
    }

    let finalArtistId = artistId ? String(artistId) : '';
    if (!finalArtistId && artistName) {
      let existingArtist = await prisma.artist.findFirst({
        where: { name: { equals: String(artistName).trim() } },
      });
      if (!existingArtist) {
        existingArtist = await prisma.artist.create({
          data: {
            name: String(artistName).trim(),
            imageUrl: coverUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(String(artistName))}`,
          },
        });
      }
      finalArtistId = existingArtist.id;
    }

    if (!finalArtistId) {
      res.status(400).json({ error: 'Artist ID or artistName is required.' });
      return;
    }

    let finalAlbumId = albumId ? String(albumId) : null;
    if (!finalAlbumId && albumTitle) {
      let existingAlbum = await prisma.album.findFirst({
        where: {
          title: { equals: String(albumTitle).trim() },
          artistId: finalArtistId,
        },
      });
      if (!existingAlbum) {
        existingAlbum = await prisma.album.create({
          data: {
            title: String(albumTitle).trim(),
            artistId: finalArtistId,
            coverUrl: coverUrl || null,
          },
        });
      }
      finalAlbumId = existingAlbum.id;
    }

    const track = await prisma.track.create({
      data: {
        title: String(title).trim(),
        artistId: finalArtistId,
        albumId: finalAlbumId,
        audioUrl,
        coverUrl: coverUrl || null,
        duration: Math.round(duration) || 180,
        genre: genre ? String(genre).trim() : 'Pop',
        trackNumber: trackNumber ? parseInt(String(trackNumber), 10) : 1,
      },
      include: {
        artist: true,
        album: true,
      },
    });

    res.status(201).json({ track: { ...track, source: 'local' } });
  } catch (error: any) {
    console.error('createTrack error:', error);
    res.status(500).json({ error: 'Failed to create track.' });
  }
};

export const updateTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const coverFile = files?.['cover']?.[0];
    const audioFile = files?.['audio']?.[0];

    const { title, genre, trackNumber, artistId, albumId, coverUrl: bodyCoverUrl, audioUrl: bodyAudioUrl } = req.body;

    let coverUrl = bodyCoverUrl ? String(bodyCoverUrl) : undefined;
    if (coverFile) {
      coverUrl = StorageService.getPublicUrl('artwork', coverFile.filename);
    }

    let audioUrl = bodyAudioUrl ? String(bodyAudioUrl) : undefined;
    let duration: number | undefined;
    if (audioFile) {
      audioUrl = StorageService.getPublicUrl('audio', audioFile.filename);
      try {
        const meta = await musicMetadata.parseFile(path.join(AUDIO_DIR, audioFile.filename));
        if (meta.format.duration) duration = Math.round(meta.format.duration);
      } catch (err) {
        // ignore
      }
    }

    const updated = await prisma.track.update({
      where: { id },
      data: {
        title: title ? String(title).trim() : undefined,
        genre: genre ? String(genre).trim() : undefined,
        trackNumber: trackNumber ? parseInt(String(trackNumber), 10) : undefined,
        artistId: artistId ? String(artistId) : undefined,
        albumId: albumId === '' ? null : albumId ? String(albumId) : undefined,
        coverUrl: coverUrl || undefined,
        audioUrl: audioUrl || undefined,
        duration: duration || undefined,
      },
      include: {
        artist: true,
        album: true,
      },
    });

    res.json({ track: { ...updated, source: 'local' } });
  } catch (error: any) {
    console.error('updateTrack error:', error);
    res.status(500).json({ error: 'Failed to update track.' });
  }
};

export const deleteTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.track.delete({ where: { id } });
    res.json({ success: true, message: 'Track deleted successfully.' });
  } catch (error: any) {
    console.error('deleteTrack error:', error);
    res.status(500).json({ error: 'Failed to delete track.' });
  }
};

export const likeTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required to like tracks.' });
      return;
    }

    // Ensure track exists in DB (creates lightweight record for Jamendo tracks if needed)
    await ensureTrackExists(id, req.body);

    await prisma.likedTrack.upsert({
      where: {
        userId_trackId: {
          userId,
          trackId: id,
        },
      },
      update: {},
      create: {
        userId,
        trackId: id,
      },
    });

    res.json({ success: true, isLiked: true });
  } catch (error: any) {
    console.error('likeTrack error:', error);
    res.status(500).json({ error: 'Failed to like track.' });
  }
};

export const unlikeTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required to unlike tracks.' });
      return;
    }

    await prisma.likedTrack.deleteMany({
      where: {
        userId,
        trackId: id,
      },
    });

    res.json({ success: true, isLiked: false });
  } catch (error: any) {
    console.error('unlikeTrack error:', error);
    res.status(500).json({ error: 'Failed to unlike track.' });
  }
};

export const recordPlay = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;

    // Ensure track exists in DB if Jamendo track
    await ensureTrackExists(id, req.body);

    await prisma.track.update({
      where: { id },
      data: { playCount: { increment: 1 } },
    });

    if (userId) {
      await prisma.recentlyPlayed.create({
        data: {
          userId,
          trackId: id,
        },
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('recordPlay error:', error);
    res.status(500).json({ error: 'Failed to record play.' });
  }
};
