import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [userCount, trackCount, artistCount, albumCount, playlistCount, totalPlays] = await Promise.all([
      prisma.user.count(),
      prisma.track.count(),
      prisma.artist.count(),
      prisma.album.count(),
      prisma.playlist.count(),
      prisma.track.aggregate({ _sum: { playCount: true } }),
    ]);

    const recentTracks = await prisma.track.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        artist: { select: { name: true } },
      },
    });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.json({
      stats: {
        totalUsers: userCount,
        totalTracks: trackCount,
        totalArtists: artistCount,
        totalAlbums: albumCount,
        totalPlaylists: playlistCount,
        totalPlays: totalPlays._sum.playCount || 0,
      },
      recentTracks,
      recentUsers,
    });
  } catch (error: any) {
    console.error('getAdminStats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
};

export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            playlists: true,
            likedTracks: true,
          },
        },
      },
    });

    res.json({ users });
  } catch (error: any) {
    console.error('getAdminUsers error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be USER or ADMIN.' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ user: updated });
  } catch (error: any) {
    console.error('updateUserRole error:', error);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    if (req.user?.id === id) {
      res.status(400).json({ error: 'You cannot delete your own account from admin dashboard.' });
      return;
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted.' });
  } catch (error: any) {
    console.error('deleteUser error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
};
