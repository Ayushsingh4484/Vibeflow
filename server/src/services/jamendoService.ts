import { ENV } from '../config/env';

export interface NormalizedTrack {
  id: string;
  source: 'jamendo' | 'local';
  title: string;
  artistId?: string;
  albumId?: string | null;
  audioUrl: string;
  coverUrl?: string | null;
  artworkUrl?: string | null;
  duration: number; // seconds
  genre?: string | null;
  trackNumber?: number;
  playCount?: number;
  createdAt?: string;
  artist?: {
    id?: string;
    name: string;
    imageUrl?: string | null;
  };
  album?: {
    id?: string;
    title: string;
    coverUrl?: string | null;
  };
  externalUrl?: string;
  licenseUrl?: string;
  isLiked?: boolean;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// In-memory cache
const memoryCache = new Map<string, CacheEntry<any>>();

function getFromCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
}

function setToCache<T>(key: string, data: T, ttlMs: number = 10 * 60 * 1000): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

// Tag / Genre mappings for Jamendo
const GENRE_TAG_MAP: Record<string, string> = {
  chill: 'chillout+downtempo',
  chillout: 'chillout',
  lofi: 'lofi+chillout',
  'lo-fi': 'lofi+chillout',
  electronic: 'electronic+synthpop',
  synthwave: 'synthwave+electronic',
  ambient: 'ambient+relaxation',
  rock: 'rock',
  pop: 'pop',
  jazz: 'jazz',
  acoustic: 'acoustic',
  focus: 'ambient+classical',
  workout: 'dance+fitness',
  cyberpunk: 'electronic+darkwave',
  techno: 'techno+electronic',
  'deep house': 'deephouse+house',
};

// Verified Creative Commons Jamendo tracks with real 500px CDN artwork and streamable audio
const FALLBACK_JAMENDO_TRACKS: NormalizedTrack[] = [
  {
    id: 'jamendo-1446700',
    source: 'jamendo',
    title: 'tous ensemble (Komintern Sect)',
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1446700&format=mp31&from=7QaWQxCIYMRUMmn3pe0BIA%3D%3D%7CSb%2FRzSjA7THRjUNALo0Vgw%3D%3D',
    coverUrl: 'https://usercontent.jamendo.com?type=album&id=168205&width=500&trackid=1446700',
    artworkUrl: 'https://usercontent.jamendo.com?type=album&id=168205&width=500&trackid=1446700',
    duration: 210,
    genre: 'Rock',
    artist: {
      id: 'jamendo-artist-les-contamines',
      name: 'Les Contaminés',
      imageUrl: 'https://usercontent.jamendo.com?type=album&id=168205&width=500&trackid=1446700',
    },
    album: {
      id: 'jamendo-album-168205',
      title: 'Tous Ensemble',
      coverUrl: 'https://usercontent.jamendo.com?type=album&id=168205&width=500&trackid=1446700',
    },
    externalUrl: 'https://www.jamendo.com/track/1446700',
    licenseUrl: 'http://creativecommons.org/licenses/by-nc-nd/4.0/',
    playCount: 14210,
  },
  {
    id: 'jamendo-1806306',
    source: 'jamendo',
    title: 'Crystal bells',
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1806306&format=mp31&from=phircbhhO1WVUI4iVpFwgg%3D%3D%7C6aTKiTqeBvQiRtcOOs08iw%3D%3D',
    coverUrl: 'https://usercontent.jamendo.com?type=album&id=197564&width=500&trackid=1806306',
    artworkUrl: 'https://usercontent.jamendo.com?type=album&id=197564&width=500&trackid=1806306',
    duration: 195,
    genre: 'Ambient',
    artist: {
      id: 'jamendo-artist-sergey-milory',
      name: 'Sergey Milory',
      imageUrl: 'https://usercontent.jamendo.com?type=album&id=197564&width=500&trackid=1806306',
    },
    album: {
      id: 'jamendo-album-197564',
      title: 'Crystal Bells Collection',
      coverUrl: 'https://usercontent.jamendo.com?type=album&id=197564&width=500&trackid=1806306',
    },
    externalUrl: 'https://www.jamendo.com/track/1806306',
    licenseUrl: 'http://creativecommons.org/licenses/by-sa/4.0/',
    playCount: 15890,
  },
  {
    id: 'jamendo-1498118',
    source: 'jamendo',
    title: 'A media luz',
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1498118&format=mp31&from=2pe40x50V8yYe6PwlK28fA%3D%3D%7COB6nh8Nwuy8P%2BsGkhgDGZQ%3D%3D',
    coverUrl: 'https://usercontent.jamendo.com?type=album&id=172727&width=500&trackid=1498118',
    artworkUrl: 'https://usercontent.jamendo.com?type=album&id=172727&width=500&trackid=1498118',
    duration: 240,
    genre: 'Acoustic',
    artist: {
      id: 'jamendo-artist-javier-de-lucas',
      name: 'Javier de Lucas',
      imageUrl: 'https://usercontent.jamendo.com?type=album&id=172727&width=500&trackid=1498118',
    },
    album: {
      id: 'jamendo-album-172727',
      title: 'A Media Luz Acoustic',
      coverUrl: 'https://usercontent.jamendo.com?type=album&id=172727&width=500&trackid=1498118',
    },
    externalUrl: 'https://www.jamendo.com/track/1498118',
    licenseUrl: 'http://creativecommons.org/licenses/by-nc/4.0/',
    playCount: 19240,
  },
  {
    id: 'jamendo-1655829',
    source: 'jamendo',
    title: 'Cheerful Company',
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1655829&format=mp31&from=mOBG5b1hVmAlrn0kPs3Teg%3D%3D%7C8%2F95RwmRm9THYLivermxZw%3D%3D',
    coverUrl: 'https://usercontent.jamendo.com?type=album&id=404317&width=500&trackid=1655829',
    artworkUrl: 'https://usercontent.jamendo.com?type=album&id=404317&width=500&trackid=1655829',
    duration: 185,
    genre: 'Pop',
    artist: {
      id: 'jamendo-artist-serge-ozeryan',
      name: 'Serge Ozeryan',
      imageUrl: 'https://usercontent.jamendo.com?type=album&id=404317&width=500&trackid=1655829',
    },
    album: {
      id: 'jamendo-album-404317',
      title: 'Happy Vibes Collection',
      coverUrl: 'https://usercontent.jamendo.com?type=album&id=404317&width=500&trackid=1655829',
    },
    externalUrl: 'https://www.jamendo.com/track/1655829',
    licenseUrl: 'http://creativecommons.org/licenses/by-nc-nd/4.0/',
    playCount: 13120,
  },
  {
    id: 'jamendo-1739669',
    source: 'jamendo',
    title: 'Chocolate River - LOOP',
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1739669&format=mp31&from=2QURh%2FHbPJ99zBOwA3VhGA%3D%3D%7CY%2BzgA4zMHTdGqRISu5DtXQ%3D%3D',
    coverUrl: 'https://usercontent.jamendo.com?type=album&id=341836&width=500&trackid=1739669',
    artworkUrl: 'https://usercontent.jamendo.com?type=album&id=341836&width=500&trackid=1739669',
    duration: 175,
    genre: 'Electronic',
    artist: {
      id: 'jamendo-artist-purple-sound',
      name: 'Purple Sound',
      imageUrl: 'https://usercontent.jamendo.com?type=album&id=341836&width=500&trackid=1739669',
    },
    album: {
      id: 'jamendo-album-341836',
      title: 'Chocolate River Beats',
      coverUrl: 'https://usercontent.jamendo.com?type=album&id=341836&width=500&trackid=1739669',
    },
    externalUrl: 'https://www.jamendo.com/track/1739669',
    licenseUrl: 'http://creativecommons.org/licenses/by-sa/4.0/',
    playCount: 17650,
  },
  {
    id: 'jamendo-1984240',
    source: 'jamendo',
    title: 'Christmas Village - 30s',
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1984240&format=mp31&from=8S3hTr9uCNXeqzWyMql6SA%3D%3D%7C90fgkXeeLWxpZtb8nURbmQ%3D%3D',
    coverUrl: 'https://usercontent.jamendo.com?type=album&id=501780&width=500&trackid=1984240',
    artworkUrl: 'https://usercontent.jamendo.com?type=album&id=501780&width=500&trackid=1984240',
    duration: 160,
    genre: 'Lo-Fi',
    artist: {
      id: 'jamendo-artist-pinegroove',
      name: 'pinegroove',
      imageUrl: 'https://usercontent.jamendo.com?type=album&id=501780&width=500&trackid=1984240',
    },
    album: {
      id: 'jamendo-album-501780',
      title: 'Christmas Village Lo-Fi',
      coverUrl: 'https://usercontent.jamendo.com?type=album&id=501780&width=500&trackid=1984240',
    },
    externalUrl: 'https://www.jamendo.com/track/1984240',
    licenseUrl: 'http://creativecommons.org/licenses/by-nc/4.0/',
    playCount: 14510,
  },
  {
    id: 'jamendo-1300000',
    source: 'jamendo',
    title: 'Luminiferous Aether',
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1300000&format=mp32&ndec=1',
    coverUrl: 'https://usercontent.jamendo.com?type=album&id=154723&width=500&trackid=1300000',
    artworkUrl: 'https://usercontent.jamendo.com?type=album&id=154723&width=500&trackid=1300000',
    duration: 230,
    genre: 'Chillout',
    artist: {
      id: 'jamendo-artist-solaris',
      name: 'SoLaRiS',
      imageUrl: 'https://usercontent.jamendo.com?type=album&id=154723&width=500&trackid=1300000',
    },
    album: {
      id: 'jamendo-album-154723',
      title: 'Aether Explorations',
      coverUrl: 'https://usercontent.jamendo.com?type=album&id=154723&width=500&trackid=1300000',
    },
    externalUrl: 'https://www.jamendo.com/track/1300000',
    licenseUrl: 'http://creativecommons.org/licenses/by-sa/4.0/',
    playCount: 12480,
  }
];

export class JamendoService {
  private static BASE_URL = 'https://api.jamendo.com/v3.0';

  private static getClientId(): string {
    return ENV.JAMENDO_CLIENT_ID || '';
  }

  public static normalizeJamendoTrack(raw: any): NormalizedTrack {
    const rawId = String(raw.id || '').replace(/^jamendo-/, '');
    const genres = raw.musicinfo?.tags?.genres || [];
    const genre = genres.length > 0 ? genres[0] : (raw.musicinfo?.tags?.vartags?.[0] || 'Creative Commons');

    // Jamendo track artwork priority:
    // 1. track.image
    // 2. track.album_image
    // 3. album_id based Jamendo CDN url
    const artworkUrl =
      raw.image ||
      raw.album_image ||
      (raw.album_id ? `https://usercontent.jamendo.com?type=album&id=${raw.album_id}&width=500&trackid=${rawId}` : null) ||
      null;

    console.log('Jamendo track artwork:', {
      id: raw.id,
      image: raw.image,
      album_image: raw.album_image,
      name: raw.name,
      resolvedArtworkUrl: artworkUrl,
    });

    return {
      id: `jamendo-${rawId}`,
      source: 'jamendo',
      title: raw.name || 'Untitled Track',
      audioUrl: raw.audio || (raw.audiodownload ? raw.audiodownload : `https://prod-1.storage.jamendo.com/?trackid=${rawId}&format=mp32&ndec=1`),
      coverUrl: artworkUrl,
      artworkUrl: artworkUrl,
      duration: raw.duration ? Math.round(raw.duration) : 180,
      genre: genre.charAt(0).toUpperCase() + genre.slice(1),
      trackNumber: raw.position || 1,
      playCount: raw.stats?.rate_downloads_total || 0,
      artist: {
        id: raw.artist_id ? `jamendo-artist-${raw.artist_id}` : undefined,
        name: raw.artist_name || 'Jamendo Artist',
        imageUrl: raw.artist_image || artworkUrl,
      },
      album: raw.album_name
        ? {
            id: raw.album_id ? `jamendo-album-${raw.album_id}` : undefined,
            title: raw.album_name,
            coverUrl: raw.album_image || artworkUrl,
          }
        : undefined,
      externalUrl: raw.shareurl || raw.shorturl || `https://www.jamendo.com/track/${rawId}`,
      licenseUrl: raw.license_ccurl || 'https://creativecommons.org/licenses/',
    };
  }

  public static async fetchFromJamendo(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const clientId = this.getClientId();
    if (!clientId) {
      return null;
    }

    const query = new URLSearchParams({
      client_id: clientId,
      format: 'jsonpretty',
      include: 'musicinfo+licenses',
      imagesize: '500',
      ...params,
    });

    const url = `${this.BASE_URL}${endpoint}?${query.toString()}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[JamendoService] HTTP error: ${res.status} ${res.statusText}`);
        return null;
      }

      const json = await res.json();
      if (json.headers?.status !== 'success') {
        console.warn(`[JamendoService] API returned error:`, json.headers?.error_message || json.headers);
        return null;
      }

      return json;
    } catch (err: any) {
      console.warn(`[JamendoService] Network error fetching ${url}:`, err.message);
      return null;
    }
  }

  public static async getPopularTracks(limit: number = 20, offset: number = 0): Promise<NormalizedTrack[]> {
    const cacheKey = `jamendo_popular_${limit}_${offset}`;
    const cached = getFromCache<NormalizedTrack[]>(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromJamendo('/tracks/', {
      limit: String(limit),
      offset: String(offset),
      order: 'popularity_total',
    });

    let tracks: NormalizedTrack[] = [];
    if (data && data.results && data.results.length > 0) {
      tracks = data.results.map((r: any) => this.normalizeJamendoTrack(r));
    } else {
      tracks = FALLBACK_JAMENDO_TRACKS.slice(0, limit);
    }

    setToCache(cacheKey, tracks, 15 * 60 * 1000); // 15 min cache
    return tracks;
  }

  public static async searchTracks(query: string, limit: number = 20): Promise<NormalizedTrack[]> {
    if (!query.trim()) return [];

    const cacheKey = `jamendo_search_${query.toLowerCase().trim()}_${limit}`;
    const cached = getFromCache<NormalizedTrack[]>(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromJamendo('/tracks/', {
      namesearch: query.trim(),
      limit: String(limit),
      order: 'popularity_total',
    });

    let tracks: NormalizedTrack[] = [];
    if (data && data.results && data.results.length > 0) {
      tracks = data.results.map((r: any) => this.normalizeJamendoTrack(r));
    } else {
      const q = query.toLowerCase();
      tracks = FALLBACK_JAMENDO_TRACKS.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist?.name.toLowerCase().includes(q) ||
          t.genre?.toLowerCase().includes(q)
      );
    }

    setToCache(cacheKey, tracks, 5 * 60 * 1000); // 5 min cache
    return tracks;
  }

  public static async getTracksByGenre(genre: string, limit: number = 20): Promise<NormalizedTrack[]> {
    const cleanGenre = genre.toLowerCase().trim();
    const mappedTag = GENRE_TAG_MAP[cleanGenre] || cleanGenre;
    const cacheKey = `jamendo_genre_${cleanGenre}_${limit}`;

    const cached = getFromCache<NormalizedTrack[]>(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromJamendo('/tracks/', {
      tags: mappedTag,
      limit: String(limit),
      order: 'popularity_total',
    });

    let tracks: NormalizedTrack[] = [];
    if (data && data.results && data.results.length > 0) {
      tracks = data.results.map((r: any) => this.normalizeJamendoTrack(r));
    } else {
      tracks = FALLBACK_JAMENDO_TRACKS.filter(
        (t) =>
          t.genre?.toLowerCase().includes(cleanGenre) ||
          t.title.toLowerCase().includes(cleanGenre)
      );
      if (tracks.length === 0) tracks = FALLBACK_JAMENDO_TRACKS.slice(0, limit);
    }

    setToCache(cacheKey, tracks, 15 * 60 * 1000);
    return tracks;
  }

  public static async getTrackById(id: string): Promise<NormalizedTrack | null> {
    const cleanId = id.replace(/^jamendo-/, '');
    const cacheKey = `jamendo_track_${cleanId}`;
    const cached = getFromCache<NormalizedTrack>(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromJamendo('/tracks/', {
      id: cleanId,
    });

    if (data && data.results && data.results.length > 0) {
      const track = this.normalizeJamendoTrack(data.results[0]);
      setToCache(cacheKey, track, 30 * 60 * 1000);
      return track;
    }

    const fallback = FALLBACK_JAMENDO_TRACKS.find((t) => t.id === `jamendo-${cleanId}` || t.id === cleanId);
    return fallback || null;
  }
}
