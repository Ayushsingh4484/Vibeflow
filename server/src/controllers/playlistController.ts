import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { StorageService } from '../services/storageService';
import { JamendoService } from '../services/jamendoService';

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

export const getPlaylists = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '20' } = req.query;

    const playlists = await prisma.playlist.findMany({
      take: parseInt(String(limit), 10),
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { tracks: true } },
      },
    });

    res.json({ playlists });
  } catch (error: any) {
    console.error('getPlaylists error:', error);
    res.status(500).json({ error: 'Failed to fetch playlists.' });
  }
};

export const getUserPlaylists = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const playlists = await prisma.playlist.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { tracks: true } },
        tracks: {
          take: 1,
          include: {
            track: {
              select: { coverUrl: true },
            },
          },
        },
      },
    });

    res.json({ playlists });
  } catch (error: any) {
    console.error('getUserPlaylists error:', error);
    res.status(500).json({ error: 'Failed to fetch user playlists.' });
  }
};

export const getPlaylistById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;

    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        tracks: {
          orderBy: { position: 'asc' },
          include: {
            track: {
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
        },
      },
    });

    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found.' });
      return;
    }

    const playlistData = playlist as any;
    const formattedTracks = (playlistData.tracks || []).map((pt: any) => ({
      ...pt.track,
      source: pt.track.id.startsWith('jamendo-') ? 'jamendo' : 'local',
      addedAt: pt.addedAt,
      position: pt.position,
      isLiked: userId ? (pt.track.likedBy && pt.track.likedBy.length > 0) : false,
      likedBy: undefined,
    }));

    const totalDuration = formattedTracks.reduce((acc: number, t: any) => acc + (t.duration || 0), 0);

    res.json({
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        coverUrl: playlist.coverUrl || (formattedTracks[0]?.coverUrl ?? null),
        userId: playlist.userId,
        user: playlistData.user,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
        tracks: formattedTracks,
        totalDuration,
        trackCount: formattedTracks.length,
      },
    });
  } catch (error: any) {
    console.error('getPlaylistById error:', error);
    res.status(500).json({ error: 'Failed to fetch playlist.' });
  }
};

export const createPlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { name, description, coverUrl: bodyCoverUrl } = req.body;
    const file = req.file;

    if (!name) {
      res.status(400).json({ error: 'Playlist name is required.' });
      return;
    }

    let coverUrl = bodyCoverUrl;
    if (file) {
      coverUrl = StorageService.getPublicUrl('artwork', file.filename);
    }

    const playlist = await prisma.playlist.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        coverUrl: coverUrl || null,
        userId,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    res.status(201).json({ playlist });
  } catch (error: any) {
    console.error('createPlaylist error:', error);
    res.status(500).json({ error: 'Failed to create playlist.' });
  }
};

export const updatePlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const existing = await prisma.playlist.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Playlist not found.' });
      return;
    }

    if (existing.userId !== userId && userRole !== 'ADMIN') {
      res.status(403).json({ error: 'You do not have permission to modify this playlist.' });
      return;
    }

    const { name, description, coverUrl: bodyCoverUrl } = req.body;
    const file = req.file;

    let coverUrl = bodyCoverUrl;
    if (file) {
      coverUrl = StorageService.getPublicUrl('artwork', file.filename);
    }

    const updated = await prisma.playlist.update({
      where: { id },
      data: {
        name: name ? String(name).trim() : undefined,
        description: description !== undefined ? (description ? String(description).trim() : null) : undefined,
        coverUrl: coverUrl || undefined,
      },
    });

    res.json({ playlist: updated });
  } catch (error: any) {
    console.error('updatePlaylist error:', error);
    res.status(500).json({ error: 'Failed to update playlist.' });
  }
};

export const deletePlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const existing = await prisma.playlist.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Playlist not found.' });
      return;
    }

    if (existing.userId !== userId && userRole !== 'ADMIN') {
      res.status(403).json({ error: 'You do not have permission to delete this playlist.' });
      return;
    }

    await prisma.playlist.delete({ where: { id } });
    res.json({ success: true, message: 'Playlist deleted.' });
  } catch (error: any) {
    console.error('deletePlaylist error:', error);
    res.status(500).json({ error: 'Failed to delete playlist.' });
  }
};

export const addTrackToPlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { trackId, track } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!trackId) {
      res.status(400).json({ error: 'trackId is required.' });
      return;
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: { tracks: { orderBy: { position: 'desc' }, take: 1 } },
    });

    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found.' });
      return;
    }

    if (playlist.userId !== userId && userRole !== 'ADMIN') {
      res.status(403).json({ error: 'You do not have permission to edit this playlist.' });
      return;
    }

    // Ensure track exists in database if external Jamendo track
    await ensureTrackExists(String(trackId), track);

    const playlistWithTracks = playlist as any;
    const tracksList = playlistWithTracks.tracks || [];
    const nextPosition = tracksList.length > 0 ? tracksList[0].position + 1 : 0;

    await prisma.playlistTrack.upsert({
      where: {
        playlistId_trackId: {
          playlistId: id,
          trackId: String(trackId),
        },
      },
      update: {
        position: nextPosition,
      },
      create: {
        playlistId: id,
        trackId: String(trackId),
        position: nextPosition,
      },
    });

    await prisma.playlist.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({ success: true, message: 'Track added to playlist.' });
  } catch (error: any) {
    console.error('addTrackToPlaylist error:', error);
    res.status(500).json({ error: 'Failed to add track to playlist.' });
  }
};

export const removeTrackFromPlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const trackId = String(req.params.trackId);
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found.' });
      return;
    }

    if (playlist.userId !== userId && userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Permission denied.' });
      return;
    }

    await prisma.playlistTrack.deleteMany({
      where: {
        playlistId: id,
        trackId,
      },
    });

    res.json({ success: true, message: 'Track removed from playlist.' });
  } catch (error: any) {
    console.error('removeTrackFromPlaylist error:', error);
    res.status(500).json({ error: 'Failed to remove track from playlist.' });
  }
};

export const reorderTracks = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { trackIds } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!Array.isArray(trackIds)) {
      res.status(400).json({ error: 'trackIds array is required.' });
      return;
    }

    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found.' });
      return;
    }

    if (playlist.userId !== userId && userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Permission denied.' });
      return;
    }

    await prisma.$transaction(
      trackIds.map((trackId: string, index: number) =>
        prisma.playlistTrack.updateMany({
          where: { playlistId: id, trackId: String(trackId) },
          data: { position: index },
        })
      )
    );

    res.json({ success: true, message: 'Playlist tracks reordered.' });
  } catch (error: any) {
    console.error('reorderTracks error:', error);
    res.status(500).json({ error: 'Failed to reorder playlist.' });
  }
};
