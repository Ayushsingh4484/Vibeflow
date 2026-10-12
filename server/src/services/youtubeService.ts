import { ENV } from '../config/env';

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

export class YouTubeService {
  private static BASE_URL = 'https://www.googleapis.com/youtube/v3';

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
        const title = (item.snippet?.title || 'YouTube Music')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        const channelTitle = (item.snippet?.channelTitle || 'Artist')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'");

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
          duration: 210, // Default duration placeholder
          genre: 'YouTube',
          youtubeId: videoId,
          artist: {
            id: `yt-artist-${item.snippet?.channelId || videoId}`,
            name: channelTitle,
            imageUrl: thumbnail,
          },
          album: {
            id: `yt-album-${videoId}`,
            title: channelTitle,
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
}
