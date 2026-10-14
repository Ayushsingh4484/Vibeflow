import { PREBUILT_PLAYLISTS, PrebuiltPlaylistDef } from '../constants/prebuiltPlaylists';
import { YouTubeService, YouTubeTrack } from './youtubeService';
import prisma from '../config/prisma';

export interface PrebuiltPlaylistSummary {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: string;
  tag: string;
  coverUrl: string;
  gradient: string;
  trackCount: number;
  isPrebuilt: true;
}

export interface PrebuiltPlaylistDetails extends PrebuiltPlaylistSummary {
  userId: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  tracks: YouTubeTrack[];
  totalDuration: number;
}

// In-memory cache for playlist tracks with 1-hour TTL
const playlistDetailsCache = new Map<string, { data: PrebuiltPlaylistDetails; expiresAt: number }>();

export class PrebuiltPlaylistService {
  /**
   * Returns list of all curated prebuilt playlists
   */
  public static getCatalog(): PrebuiltPlaylistSummary[] {
    return PREBUILT_PLAYLISTS.map((item) => {
      // If we have cached details with updated cover or track count, merge it
      const cached = playlistDetailsCache.get(item.id);
      return {
        id: item.id,
        name: item.name,
        subtitle: item.subtitle,
        description: item.description,
        category: item.category,
        tag: item.tag,
        coverUrl: cached?.data?.coverUrl || item.defaultCoverUrl,
        gradient: item.gradient,
        trackCount: cached?.data?.tracks?.length || item.estimatedTracks,
        isPrebuilt: true,
      };
    });
  }

  /**
   * Retrieves full details and tracks for a prebuilt playlist
   */
  public static async getPlaylistById(id: string): Promise<PrebuiltPlaylistDetails | null> {
    const def = PREBUILT_PLAYLISTS.find(
      (p) => p.id === id || p.id === `prebuilt-${id}` || p.id.replace('prebuilt-', '') === id
    );

    if (!def) {
      // Check if it's a raw YouTube playlist ID (yt-playlist-...)
      if (id.startsWith('yt-playlist-')) {
        return await this.fetchGenericYouTubePlaylist(id);
      }
      return null;
    }

    const cached = playlistDetailsCache.get(def.id);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    let tracks: YouTubeTrack[] = [];
    let resolvedCoverUrl = def.defaultCoverUrl;

    try {
      // 1. Try searching for a public YouTube playlist
      const ytPlaylists = await YouTubeService.searchArtistPlaylists(def.searchQuery, 3);
      if (ytPlaylists && ytPlaylists.length > 0) {
        const topPlaylist = ytPlaylists[0];
        const playlistTracks = await YouTubeService.getPlaylistTracks(topPlaylist.ytPlaylistId, 25);
        if (playlistTracks && playlistTracks.length >= 5) {
          tracks = playlistTracks;
          if (topPlaylist.coverUrl && !topPlaylist.coverUrl.includes('unsplash')) {
            resolvedCoverUrl = topPlaylist.coverUrl;
          }
        }
      }

      // 2. Fallback to direct video search if playlist lookup returned few tracks
      if (tracks.length < 5) {
        const searchedTracks = await YouTubeService.searchTracks(def.searchQuery, 20);
        if (searchedTracks && searchedTracks.length > 0) {
          tracks = searchedTracks;
        }
      }

      // 3. Last fallback if API quota or offline: try trending music
      if (tracks.length === 0) {
        const trending = await YouTubeService.getTrendingMusic(20);
        if (trending && trending.length > 0) {
          tracks = trending;
        }
      }
    } catch (err: any) {
      console.warn(`[PrebuiltPlaylistService] Failed to load tracks for ${def.id}:`, err.message);
    }

    const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 210), 0);

    const details: PrebuiltPlaylistDetails = {
      id: def.id,
      name: def.name,
      subtitle: def.subtitle,
      description: def.description,
      category: def.category,
      tag: def.tag,
      coverUrl: resolvedCoverUrl,
      gradient: def.gradient,
      trackCount: tracks.length,
      isPrebuilt: true,
      userId: 'vibeflow-curated',
      user: {
        id: 'vibeflow-curated',
        name: 'VibeFlow Curators',
        avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80',
      },
      tracks,
      totalDuration,
    };

    // Cache for 1 hour
    playlistDetailsCache.set(def.id, {
      data: details,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });

    return details;
  }

  /**
   * Helper for generic YouTube playlist IDs
   */
  private static async fetchGenericYouTubePlaylist(ytId: string): Promise<PrebuiltPlaylistDetails | null> {
    const cleanId = ytId.replace(/^yt-playlist-/, '');
    const tracks = await YouTubeService.getPlaylistTracks(cleanId, 25);
    if (!tracks || tracks.length === 0) return null;

    const coverUrl = tracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80';
    const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 210), 0);

    return {
      id: ytId,
      name: tracks[0]?.album?.title || 'YouTube Curated Playlist',
      subtitle: 'Curated by YouTube Music',
      description: 'Official YouTube music selection.',
      category: 'Hits & Charts',
      tag: 'YouTube',
      coverUrl,
      gradient: 'from-red-600 to-zinc-900',
      trackCount: tracks.length,
      isPrebuilt: true,
      userId: 'vibeflow-curated',
      user: {
        id: 'vibeflow-curated',
        name: 'YouTube Music',
        avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80',
      },
      tracks,
      totalDuration,
    };
  }

  /**
   * Saves / clones a prebuilt playlist to the user's personal library in SQLite
   */
  public static async saveToUserLibrary(prebuiltId: string, userId: string): Promise<any> {
    const details = await this.getPlaylistById(prebuiltId);
    if (!details) {
      throw new Error('Prebuilt playlist not found.');
    }

    // Clean name without emoji for user library if preferred, or keep full name
    const cleanName = details.name;

    // Create user playlist
    const newPlaylist = await prisma.playlist.create({
      data: {
        name: cleanName,
        description: details.description || `Saved from VibeFlow's ${details.name}`,
        coverUrl: details.coverUrl,
        userId,
      },
    });

    // Save tracks and link them
    for (let i = 0; i < details.tracks.length; i++) {
      const t = details.tracks[i];
      try {
        let existingTrack = await prisma.track.findUnique({ where: { id: t.id } });
        if (!existingTrack) {
          // Find or create artist
          const artistName = (t.artist?.name || 'VibeFlow Artist').trim();
          let artist = await prisma.artist.findFirst({ where: { name: artistName } });
          if (!artist) {
            artist = await prisma.artist.create({
              data: {
                name: artistName,
                imageUrl: t.artist?.imageUrl || t.coverUrl,
              },
            });
          }

          existingTrack = await prisma.track.create({
            data: {
              id: t.id,
              title: t.title,
              artistId: artist.id,
              audioUrl: t.audioUrl,
              coverUrl: t.coverUrl,
              duration: t.duration || 210,
              genre: t.genre || 'Music',
            },
          });
        }

        // Link in playlistTrack
        await prisma.playlistTrack.create({
          data: {
            playlistId: newPlaylist.id,
            trackId: existingTrack.id,
            position: i,
          },
        });
      } catch (trackErr: any) {
        // Skip duplicate or failed individual tracks
      }
    }

    return newPlaylist;
  }
}
