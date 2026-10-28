import { ENV } from '../config/env';
import { cleanTrackMetadata } from '../utils/cleanTrackMetadata';

export interface YouTubeTrack {
  id: string;
  source: 'youtube';
  title: string;
  artistId?: string;
  albumId?: string | null;
  audioUrl: string;
  coverUrl: string;
  artworkUrl: string;
  duration: number;
  genre: string;
  youtubeId: string;
  playCount?: number;
  artist: {
    id?: string;
    name: string;
    imageUrl?: string | null;
  };
  album?: {
    id?: string;
    title: string;
    coverUrl?: string | null;
  };
}

const memoryCache = new Map<string, { data: any; expiresAt: number }>();

function getCache<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.data;
}

function setCache<T>(key: string, data: T, ttlMs: number = 10 * 60 * 1000): void {
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function parseDurationISO(durationStr?: string): number {
  if (!durationStr) return 210;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 210;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : 210;
}

export class YouTubeService {
  private static BASE_URL = 'https://www.googleapis.com/youtube/v3';

  /**
   * Get search keyword suggestions for music
   */
  public static async getSearchSuggestions(query: string, limit: number = 8): Promise<string[]> {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    const cacheKey = `yt_suggest_${q}_${limit}`;
    const cached = getCache<string[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query.trim())}`;
      const res = await fetch(url);
      if (!res.ok) return [];

      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[1])) {
        const rawSuggestions: string[] = data[1];
        // Clean suggestions
        const clean = rawSuggestions
          .filter((s) => typeof s === 'string' && s.trim().length > 0)
          .slice(0, limit);
        setCache(cacheKey, clean, 10 * 60 * 1000);
        return clean;
      }
      return [];
    } catch (err: any) {
      console.warn('[YouTubeService] getSearchSuggestions error:', err.message);
      return [];
    }
  }

  /**
   * Search YouTube music tracks
   */
  public static async searchTracks(query: string, limit: number = 10): Promise<YouTubeTrack[]> {
    const apiKey = ENV.YT_API_KEY;
    if (!apiKey || !query.trim()) return [];

    const cacheKey = `yt_search_${query.toLowerCase().trim()}_${limit}`;
    const cached = getCache<YouTubeTrack[]>(cacheKey);
    if (cached) return cached;

    try {
      const q = `${query.trim()} official audio`;
      const url = `${this.BASE_URL}/search?part=snippet&q=${encodeURIComponent(q)}&type=video&videoCategoryId=10&maxResults=${limit}&key=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) {
        console.warn('[YouTubeService] Search response status:', res.status);
        return [];
      }

      const data = await res.json();
      if (!data.items || !Array.isArray(data.items)) return [];

      const tracks: YouTubeTrack[] = data.items.map((item: any) => {
        const videoId = item.id?.videoId || '';
        const rawTitle = (item.snippet?.title || 'YouTube Music')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        const rawChannel = (item.snippet?.channelTitle || 'Artist')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'");

        const cleanedMeta = cleanTrackMetadata(rawTitle, rawChannel);
        const title = cleanedMeta.title;
        const artistName = cleanedMeta.artist;

        const thumbnail =
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        return {
          id: `yt-${videoId}`,
          source: 'youtube',
          title,
          audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
          coverUrl: thumbnail,
          artworkUrl: thumbnail,
          duration: 210,
          genre: 'YouTube',
          youtubeId: videoId,
          artist: {
            id: `yt-artist-${item.snippet?.channelId || videoId}`,
            name: artistName,
            imageUrl: thumbnail,
          },
          album: {
            id: `yt-album-${videoId}`,
            title: artistName,
            coverUrl: thumbnail,
          },
        };
      });

      setCache(cacheKey, tracks, 15 * 60 * 1000);
      return tracks;
    } catch (err: any) {
      console.warn('[YouTubeService] Error searching YouTube:', err.message);
      return [];
    }
  }

  /**
   * Fetch Top Trending YouTube Music tracks
   */
  public static async getTrendingMusic(limit: number = 10, regionCode: string = 'IN'): Promise<YouTubeTrack[]> {
    const apiKey = ENV.YT_API_KEY;
    if (!apiKey) return [];

    const cacheKey = `yt_trending_${regionCode}_${limit}`;
    const cached = getCache<YouTubeTrack[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.BASE_URL}/videos?part=snippet,contentDetails,statistics&chart=mostPopular&videoCategoryId=10&regionCode=${encodeURIComponent(regionCode)}&maxResults=${limit}&key=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) {
        console.warn('[YouTubeService] Trending response status:', res.status);
        return [];
      }

      const data = await res.json();
      if (!data.items || !Array.isArray(data.items)) return [];

      const tracks: YouTubeTrack[] = data.items.map((item: any) => {
        const videoId = item.id || '';
        const rawTitle = (item.snippet?.title || 'Trending Song')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        const rawChannel = (item.snippet?.channelTitle || 'Artist')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'");

        const cleanedMeta = cleanTrackMetadata(rawTitle, rawChannel);
        const title = cleanedMeta.title;
        const artistName = cleanedMeta.artist;

        const thumbnail =
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.standard?.url ||
          item.snippet?.thumbnails?.default?.url ||
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        const duration = parseDurationISO(item.contentDetails?.duration);
        const playCount = item.statistics?.viewCount ? parseInt(item.statistics.viewCount, 10) : 50000;

        return {
          id: `yt-${videoId}`,
          source: 'youtube',
          title,
          audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
          coverUrl: thumbnail,
          artworkUrl: thumbnail,
          duration,
          genre: 'Trending',
          youtubeId: videoId,
          playCount,
          artist: {
            id: `yt-artist-${item.snippet?.channelId || videoId}`,
            name: artistName,
            imageUrl: thumbnail,
          },
          album: {
            id: `yt-album-${videoId}`,
            title: artistName,
            coverUrl: thumbnail,
          },
        };
      });

      setCache(cacheKey, tracks, 30 * 60 * 1000); // 30 min cache for trending
      return tracks;
    } catch (err: any) {
      console.warn('[YouTubeService] Error fetching trending music:', err.message);
      return [];
    }
  }

  /**
   * Search YouTube playlists for an artist
   */
  public static async searchArtistPlaylists(artistName: string, limit: number = 8): Promise<any[]> {
    const apiKey = ENV.YT_API_KEY;
    if (!apiKey || !artistName.trim()) return [];

    const cacheKey = `yt_playlists_${artistName.toLowerCase().trim()}_${limit}`;
    const cached = getCache<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const q = `${artistName.trim()} hits playlist`;
      const url = `${this.BASE_URL}/search?part=snippet&q=${encodeURIComponent(q)}&type=playlist&maxResults=${limit}&key=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) return [];

      const data = await res.json();
      if (!data.items || !Array.isArray(data.items)) return [];

      const playlists = data.items.map((item: any) => {
        const playlistId = item.id?.playlistId || '';
        const title = (item.snippet?.title || `${artistName} Playlist`)
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");

        const thumbnail =
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          `https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80`;

        return {
          id: `yt-playlist-${playlistId}`,
          ytPlaylistId: playlistId,
          title,
          description: item.snippet?.description || `Curated music collection for ${artistName}`,
          coverUrl: thumbnail,
          channelTitle: item.snippet?.channelTitle || 'YouTube Music',
          trackCount: 15,
        };
      });

      setCache(cacheKey, playlists, 30 * 60 * 1000);
      return playlists;
    } catch (err: any) {
      console.warn('[YouTubeService] Error searching playlists:', err.message);
      return [];
    }
  }

  /**
   * Get tracks from a YouTube playlist
   */
  public static async getPlaylistTracks(playlistId: string, limit: number = 20): Promise<YouTubeTrack[]> {
    const apiKey = ENV.YT_API_KEY;
    const cleanPid = playlistId.replace(/^yt-playlist-/, '');
    if (!apiKey || !cleanPid) return [];

    const cacheKey = `yt_plist_tracks_${cleanPid}_${limit}`;
    const cached = getCache<YouTubeTrack[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.BASE_URL}/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(cleanPid)}&maxResults=${limit}&key=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) return [];

      const data = await res.json();
      if (!data.items || !Array.isArray(data.items)) return [];

      const tracks: YouTubeTrack[] = data.items
        .filter((item: any) => item.contentDetails?.videoId)
        .map((item: any) => {
          const videoId = item.contentDetails?.videoId || '';
          const rawTitle = (item.snippet?.title || 'Track')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
          const rawChannel = (item.snippet?.channelTitle || 'Artist')
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'");

          const cleanedMeta = cleanTrackMetadata(rawTitle, rawChannel);
          const title = cleanedMeta.title;
          const artistName = cleanedMeta.artist;

          const thumbnail =
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

          return {
            id: `yt-${videoId}`,
            source: 'youtube',
            title,
            audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
            coverUrl: thumbnail,
            artworkUrl: thumbnail,
            duration: 210,
            genre: 'YouTube Music',
            youtubeId: videoId,
            playCount: 10000,
            artist: {
              id: `yt-artist-${item.snippet?.channelId || videoId}`,
              name: artistName,
              imageUrl: thumbnail,
            },
            album: {
              id: `yt-playlist-${cleanPid}`,
              title: artistName,
              coverUrl: thumbnail,
            },
          };
        });

      setCache(cacheKey, tracks, 30 * 60 * 1000);
      return tracks;
    } catch (err: any) {
      console.warn('[YouTubeService] Error fetching playlist tracks:', err.message);
      return [];
    }
  }

  /**
   * Get real track metadata for a specific YouTube video ID
   */
  public static async getTrackById(videoIdOrTrackId: string): Promise<YouTubeTrack | null> {
    const videoId = videoIdOrTrackId.replace(/^yt-/, '').trim();
    if (!videoId) return null;

    const cacheKey = `yt_track_${videoId}`;
    const cached = getCache<YouTubeTrack>(cacheKey);
    if (cached) return cached;

    const apiKey = ENV.YT_API_KEY;

    // 1. Try official YouTube Data API v3 if API key is present
    if (apiKey) {
      try {
        const url = `${this.BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${encodeURIComponent(videoId)}&key=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            const item = data.items[0];
            const rawTitle = (item.snippet?.title || 'YouTube Music')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
            const rawChannel = (item.snippet?.channelTitle || 'Artist')
              .replace(/&amp;/g, '&')
              .replace(/&#39;/g, "'");

            const cleanedMeta = cleanTrackMetadata(rawTitle, rawChannel);
            const title = cleanedMeta.title;
            const artistName = cleanedMeta.artist;

            const thumbnail =
              item.snippet?.thumbnails?.maxres?.url ||
              item.snippet?.thumbnails?.high?.url ||
              item.snippet?.thumbnails?.medium?.url ||
              `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

            const duration = parseDurationISO(item.contentDetails?.duration);
            const playCount = item.statistics?.viewCount ? parseInt(item.statistics.viewCount, 10) : 50000;

            const track: YouTubeTrack = {
              id: `yt-${videoId}`,
              source: 'youtube',
              title,
              audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
              coverUrl: thumbnail,
              artworkUrl: thumbnail,
              duration,
              genre: 'YouTube Music',
              youtubeId: videoId,
              playCount,
              artist: {
                id: `yt-artist-${item.snippet?.channelId || videoId}`,
                name: artistName,
                imageUrl: thumbnail,
              },
              album: {
                id: `yt-album-${videoId}`,
                title: artistName,
                coverUrl: thumbnail,
              },
            };

            setCache(cacheKey, track, 60 * 60 * 1000); // 1 hour cache
            return track;
          }
        }
      } catch (err: any) {
        console.warn(`[YouTubeService] API getTrackById failed for ${videoId}:`, err.message);
      }
    }

    // 2. Reliable oEmbed fallback (Works without API key / quota limits)
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const oembed = await res.json();
        const rawTitle = (oembed.title || 'YouTube Music')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        const authorName = (oembed.author_name || 'YouTube Artist')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'");

        const cleanedMeta = cleanTrackMetadata(rawTitle, authorName);
        const title = cleanedMeta.title;
        const artistName = cleanedMeta.artist;

        const thumbnail = oembed.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        const track: YouTubeTrack = {
          id: `yt-${videoId}`,
          source: 'youtube',
          title,
          audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
          coverUrl: thumbnail,
          artworkUrl: thumbnail,
          duration: 210,
          genre: 'YouTube Music',
          youtubeId: videoId,
          playCount: 15000,
          artist: {
            id: `yt-artist-${videoId}`,
            name: artistName,
            imageUrl: thumbnail,
          },
          album: {
            id: `yt-album-${videoId}`,
            title: artistName,
            coverUrl: thumbnail,
          },
        };

        setCache(cacheKey, track, 60 * 60 * 1000);
        return track;
      }
    } catch (oembedErr: any) {
      console.warn(`[YouTubeService] oEmbed getTrackById failed for ${videoId}:`, oembedErr.message);
    }

    return null;
  }
}
