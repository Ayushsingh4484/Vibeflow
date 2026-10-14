import prisma from '../config/prisma';
import { ENV } from '../config/env';
import { ARTIST_CATALOG, CatalogArtist } from '../constants/artistCatalog';

export interface NormalizedArtistMetadata {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string;
  browseId?: string;
  channelId?: string;
  bio?: string;
  monthlyListeners?: string;
  category?: string;
  region?: string;
  source: 'youtube-music' | 'youtube' | 'catalog' | 'database' | 'fallback';
}

interface ArtistFetchResult {
  imageUrl: string;
  thumbnailUrl: string;
  browseId?: string;
  channelId?: string;
  monthlyListeners?: string;
  bio?: string;
  source: 'youtube-music' | 'youtube';
}

interface CacheEntry {
  data: NormalizedArtistMetadata;
  expiresAt: number;
}

// 24 hour cache for successful lookups
const successCache = new Map<string, CacheEntry>();
const SUCCESS_TTL_MS = 24 * 60 * 60 * 1000;

// 30 second cooldown cache for failed lookups (prevents spam, but does NOT permanently cache failure)
const failureCooldownCache = new Map<string, number>();
const FAILURE_COOLDOWN_MS = 30 * 1000;

export function normalizeArtistKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w]/g, '')
    .trim();
}

export function isPlaceholderOrGenericUrl(url?: string | null): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes('dicebear.com') ||
    lower.includes('unsplash.com') ||
    lower.includes('via.placeholder') ||
    lower.includes('placeholder.com') ||
    lower.includes('img.youtube.com/vi/') // Video thumbnail, not artist portrait
  );
}

export function upgradeThumbnailUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  // Upgrade Google User Content / YouTube Music thumbnails to 600x600 high-res portrait
  if (rawUrl.includes('googleusercontent.com') || rawUrl.includes('ggpht.com')) {
    if (rawUrl.includes('=w') || rawUrl.includes('=s')) {
      return rawUrl.replace(/=(w\d+-h\d+|s\d+).*$/, '=w600-h600-p-l90-rj');
    }
    return `${rawUrl}=w600-h600-p-l90-rj`;
  }
  return rawUrl;
}

export class ArtistMetadataService {
  /**
   * Fetch normalized artist metadata with real artist photo using YouTube Music API
   */
  public static async getArtistMetadata(nameOrQuery: string): Promise<NormalizedArtistMetadata> {
    const rawQuery = (nameOrQuery || '').trim();
    if (!rawQuery) {
      throw new Error('Artist name cannot be empty');
    }

    const stableKey = normalizeArtistKey(rawQuery);

    // 1. Check in-memory success cache
    const cached = successCache.get(stableKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    // 2. Check curated catalog for metadata & pre-resolved browseId
    const catalogItem = ARTIST_CATALOG.find(
      (a) =>
        normalizeArtistKey(a.name) === stableKey ||
        normalizeArtistKey(a.id) === stableKey
    );

    const targetName = catalogItem ? catalogItem.name : rawQuery;

    // 3. Check Database for existing artist record
    let dbArtist: any = null;
    try {
      dbArtist = await prisma.artist.findFirst({
        where: {
          OR: [
            { name: { equals: targetName } },
            { id: rawQuery },
          ],
        },
      });
    } catch (err: any) {
      console.warn('[ArtistMetadataService] DB check warning:', err.message);
    }

    // If DB artist already has a real (non-placeholder) photo, return it
    if (dbArtist && !isPlaceholderOrGenericUrl(dbArtist.imageUrl)) {
      const metadata: NormalizedArtistMetadata = {
        id: dbArtist.id,
        name: dbArtist.name,
        imageUrl: dbArtist.imageUrl!,
        thumbnailUrl: dbArtist.imageUrl!,
        bio: dbArtist.bio || catalogItem?.bio || `Music by ${dbArtist.name}`,
        monthlyListeners: catalogItem?.monthlyListeners || '10M+',
        category: catalogItem?.category || 'Music',
        region: catalogItem?.region || 'International',
        browseId: catalogItem?.browseId,
        source: 'database',
      };
      successCache.set(stableKey, { data: metadata, expiresAt: Date.now() + SUCCESS_TTL_MS });
      return metadata;
    }

    // Check failure cooldown to avoid hitting the API repeatedly in a short burst
    const failureCooldown = failureCooldownCache.get(stableKey);
    if (failureCooldown && Date.now() < failureCooldown) {
      // Return a clean fallback without spamming external API
      return this.buildFallbackResult(targetName, catalogItem, dbArtist);
    }

    // 4. Resolve via YouTube Music:
    // 4a. If catalog already has a browseId, fetch artist profile directly via browseId!
    let ytmResult: ArtistFetchResult | null = null;
    if (catalogItem?.browseId) {
      ytmResult = await this.fetchArtistProfileByBrowseId(catalogItem.browseId, targetName);
    }

    // 4b. If no browseId or direct browse didn't return a photo, search YouTube Music
    if (!ytmResult) {
      ytmResult = await this.searchYouTubeMusicArtist(targetName);
    }

    // 4c. If initial search failed, retry with more precise query: `${targetName} artist`
    if (!ytmResult) {
      ytmResult = await this.searchYouTubeMusicArtist(`${targetName} artist`);
    }

    // 5. Secondary fallback: YouTube Data API v3 Channel Search
    if (!ytmResult) {
      ytmResult = await this.fetchFromYouTubeChannels(targetName);
    }

    // 6. If result found, persist in DB and successCache
    if (ytmResult && ytmResult.imageUrl && !isPlaceholderOrGenericUrl(ytmResult.imageUrl)) {
      const finalBio =
        catalogItem?.bio ||
        ytmResult.bio ||
        dbArtist?.bio ||
        `Explore official songs, hits, and playlists by ${targetName}.`;

      const finalAudience =
        catalogItem?.monthlyListeners ||
        ytmResult.monthlyListeners ||
        '10M+';

      const normalized: NormalizedArtistMetadata = {
        id: dbArtist?.id || catalogItem?.id || `yt-${encodeURIComponent(targetName)}`,
        name: targetName,
        imageUrl: ytmResult.imageUrl,
        thumbnailUrl: ytmResult.thumbnailUrl || ytmResult.imageUrl,
        browseId: ytmResult.browseId || catalogItem?.browseId,
        channelId: ytmResult.channelId,
        bio: finalBio,
        monthlyListeners: finalAudience,
        category: catalogItem?.category || 'Music',
        region: catalogItem?.region || 'International',
        source: ytmResult.source,
      };

      // Asynchronously update / sync with SQLite DB
      this.syncWithDatabase(targetName, ytmResult.imageUrl, finalBio).catch((err) =>
        console.warn('[ArtistMetadataService] Database sync error:', err.message)
      );

      // Cache successful result for 24 hours
      successCache.set(stableKey, { data: normalized, expiresAt: Date.now() + SUCCESS_TTL_MS });
      failureCooldownCache.delete(stableKey);
      return normalized;
    }

    // 7. If all searches fail, record short cooldown (30s) and return safe clean fallback
    failureCooldownCache.set(stableKey, Date.now() + FAILURE_COOLDOWN_MS);
    return this.buildFallbackResult(targetName, catalogItem, dbArtist);
  }

  /**
   * Safe Fallback Builder (avoids showing unrelated singers or breaking layout)
   */
  private static buildFallbackResult(
    targetName: string,
    catalogItem?: CatalogArtist,
    dbArtist?: any
  ): NormalizedArtistMetadata {
    const fallbackImage =
      (catalogItem && !isPlaceholderOrGenericUrl(catalogItem.imageUrl) ? catalogItem.imageUrl : null) ||
      `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80`;

    return {
      id: dbArtist?.id || catalogItem?.id || `yt-${encodeURIComponent(targetName)}`,
      name: targetName,
      imageUrl: fallbackImage,
      thumbnailUrl: fallbackImage,
      browseId: catalogItem?.browseId,
      bio: catalogItem?.bio || dbArtist?.bio || `Explore music by ${targetName}.`,
      monthlyListeners: catalogItem?.monthlyListeners || '10M+',
      category: catalogItem?.category || 'Music',
      region: catalogItem?.region || 'International',
      source: 'fallback',
    };
  }

  /**
   * Fetch artist profile directly by valid YouTube Music browseId
   */
  public static async fetchArtistProfileByBrowseId(
    browseId: string,
    expectedName?: string
  ): Promise<ArtistFetchResult | null> {
    if (!browseId || !browseId.startsWith('UC')) return null;

    try {
      const url = 'https://music.youtube.com/youtubei/v1/browse?prettyPrint=false';
      const body = {
        context: {
          client: {
            clientName: 'WEB_REMIX',
            clientVersion: '1.20240212.01.00',
            hl: 'en',
            gl: 'IN',
          },
        },
        browseId,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) return null;

      const data = await res.json();
      const h = data.header || {};
      const header =
        h.musicImmersiveHeaderRenderer ||
        h.musicVisualHeaderRenderer ||
        h.musicHeaderRenderer ||
        Object.values(h)[0];

      if (!header) return null;

      const title = header.title?.runs?.[0]?.text || '';
      if (expectedName && title) {
        const normTitle = normalizeArtistKey(title);
        const normExp = normalizeArtistKey(expectedName);
        if (!normTitle.includes(normExp) && !normExp.includes(normTitle)) {
          // Name mismatch, reject
          return null;
        }
      }

      // Extract thumbnails safely from diverse header structures
      const thumbs =
        header.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
        header.thumbnail?.thumbnails ||
        header.foregroundThumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
        header.thumbnails ||
        [];

      if (!thumbs || thumbs.length === 0) return null;

      const rawUrl = thumbs[thumbs.length - 1]?.url || '';
      if (!rawUrl) return null;

      const highResUrl = upgradeThumbnailUrl(rawUrl);

      // Extract monthly audience & bio
      const monthlyListeners = header.monthlyListenerCount?.runs?.[0]?.text;
      const bio = header.description?.runs?.[0]?.text;

      return {
        imageUrl: highResUrl,
        thumbnailUrl: rawUrl,
        browseId,
        monthlyListeners,
        bio,
        source: 'youtube-music',
      };
    } catch (err: any) {
      console.warn('[ArtistMetadataService] fetchArtistProfileByBrowseId error:', err.message);
      return null;
    }
  }

  /**
   * Search YouTube Music specifically for artist results
   */
  private static async searchYouTubeMusicArtist(query: string): Promise<ArtistFetchResult | null> {
    try {
      const url = 'https://music.youtube.com/youtubei/v1/search?prettyPrint=false';
      const body = {
        context: {
          client: {
            clientName: 'WEB_REMIX',
            clientVersion: '1.20240212.01.00',
            hl: 'en',
            gl: 'IN',
          },
        },
        query,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) return null;

      const data = await res.json();
      const tabs =
        data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
          ?.contents || [];

      const cleanQuery = normalizeArtistKey(query.replace(/\bartist\b/gi, ''));

      // Check 1: musicCardShelfRenderer (primary artist spotlight)
      for (const section of tabs) {
        const card = section.musicCardShelfRenderer;
        if (!card) continue;

        const titleText = card.title?.runs?.[0]?.text || '';
        const normTitle = normalizeArtistKey(titleText);
        const pageType =
          card.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs
            ?.browseEndpointContextMusicConfig?.pageType;
        const subtitleText =
          card.subtitle?.runs?.map((r: any) => r.text).join('') || '';
        const thumbnailCrop = card.thumbnail?.musicThumbnailRenderer?.thumbnailCrop;

        const isArtist =
          pageType === 'MUSIC_PAGE_TYPE_ARTIST' ||
          subtitleText.toLowerCase().includes('artist') ||
          thumbnailCrop === 'MUSIC_THUMBNAIL_CROP_CIRCLE';

        // Check if title matches artist query
        const matchesQuery =
          normTitle.includes(cleanQuery) ||
          cleanQuery.includes(normTitle);

        if (isArtist && matchesQuery) {
          const browseId =
            card.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;

          // If browseId is available, fetch the full artist profile for highest resolution image
          if (browseId) {
            const profile = await this.fetchArtistProfileByBrowseId(browseId, titleText);
            if (profile) return profile;
          }

          // Fallback to card's own thumbnail
          const thumbs =
            card.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
          if (thumbs.length > 0) {
            const rawUrl = thumbs[thumbs.length - 1]?.url || '';
            if (rawUrl) {
              const highResUrl = upgradeThumbnailUrl(rawUrl);
              const matchAudience = subtitleText.match(/([\d\.]+[KMBkmb]?)\s+(?:monthly audience|subscribers|listeners)/i);
              return {
                imageUrl: highResUrl,
                thumbnailUrl: rawUrl,
                browseId,
                monthlyListeners: matchAudience ? matchAudience[1].toUpperCase() : undefined,
                source: 'youtube-music',
              };
            }
          }
        }
      }

      // Check 2: musicShelfRenderer (shelf item with artist pageType)
      for (const section of tabs) {
        const shelf = section.musicShelfRenderer;
        if (!shelf || !shelf.contents) continue;

        for (const item of shelf.contents) {
          const r = item.musicResponsiveListItemRenderer;
          if (!r) continue;

          const title =
            r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.title?.runs?.[0]?.text || '';
          const normTitle = normalizeArtistKey(title);
          const pageType =
            r.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs
              ?.browseEndpointContextMusicConfig?.pageType;

          if (pageType === 'MUSIC_PAGE_TYPE_ARTIST') {
            const matchesQuery =
              normTitle.includes(cleanQuery) || cleanQuery.includes(normTitle);

            if (matchesQuery) {
              const browseId = r.navigationEndpoint?.browseEndpoint?.browseId;
              if (browseId) {
                const profile = await this.fetchArtistProfileByBrowseId(browseId, title);
                if (profile) return profile;
              }

              const thumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
              if (thumbs.length > 0) {
                const rawUrl = thumbs[thumbs.length - 1]?.url || '';
                if (rawUrl) {
                  return {
                    imageUrl: upgradeThumbnailUrl(rawUrl),
                    thumbnailUrl: rawUrl,
                    browseId,
                    source: 'youtube-music',
                  };
                }
              }
            }
          }
        }
      }

      return null;
    } catch (err: any) {
      console.warn('[ArtistMetadataService] searchYouTubeMusicArtist error:', err.message);
      return null;
    }
  }

  /**
   * Fallback: YouTube Data API v3 channel search
   */
  private static async fetchFromYouTubeChannels(
    artistName: string
  ): Promise<ArtistFetchResult | null> {
    const apiKey = ENV.YT_API_KEY;
    if (!apiKey) return null;

    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        artistName
      )}&type=channel&maxResults=3&key=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) return null;

      const data = await res.json();
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) return null;

      const normQuery = normalizeArtistKey(artistName);

      for (const item of data.items) {
        const title = item.snippet?.title || '';
        const normTitle = normalizeArtistKey(title);

        if (normTitle.includes(normQuery) || normQuery.includes(normTitle)) {
          const thumbs = item.snippet?.thumbnails;
          const rawUrl = thumbs?.high?.url || thumbs?.medium?.url || thumbs?.default?.url;
          if (rawUrl) {
            return {
              imageUrl: upgradeThumbnailUrl(rawUrl),
              thumbnailUrl: rawUrl,
              channelId: item.snippet?.channelId,
              source: 'youtube',
            };
          }
        }
      }

      return null;
    } catch (err: any) {
      console.warn('[ArtistMetadataService] fetchFromYouTubeChannels error:', err.message);
      return null;
    }
  }

  /**
   * Internal: Synchronize verified artist portrait and bio to SQLite Prisma database
   */
  public static async syncWithDatabase(name: string, imageUrl: string, bio?: string): Promise<void> {
    try {
      const existing = await prisma.artist.findFirst({
        where: { name: { equals: name } },
      });

      if (existing) {
        if (isPlaceholderOrGenericUrl(existing.imageUrl)) {
          await prisma.artist.update({
            where: { id: existing.id },
            data: {
              imageUrl,
              bio: existing.bio || bio,
            },
          });
        }
      } else {
        await prisma.artist.create({
          data: {
            name,
            imageUrl,
            bio: bio || `Official artist page for ${name}`,
          },
        });
      }
    } catch (err: any) {
      console.warn('[ArtistMetadataService] Database sync error:', err.message);
    }
  }

  /**
   * Get enriched catalog with verified photos for all catalog artists
   */
  public static async getEnrichedCatalog(): Promise<CatalogArtist[]> {
    const cacheKey = 'enriched_catalog_all';
    const cached = successCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return (cached as any).catalog;
    }

    const enriched = await Promise.all(
      ARTIST_CATALOG.map(async (artist) => {
        try {
          const meta = await this.getArtistMetadata(artist.name);
          return {
            ...artist,
            imageUrl: meta.imageUrl,
            monthlyListeners: meta.monthlyListeners || artist.monthlyListeners,
            bio: meta.bio || artist.bio,
            browseId: meta.browseId || artist.browseId,
          };
        } catch {
          return artist;
        }
      })
    );

    (successCache as any).set(cacheKey, {
      catalog: enriched,
      expiresAt: Date.now() + SUCCESS_TTL_MS,
    });

    return enriched;
  }
}
