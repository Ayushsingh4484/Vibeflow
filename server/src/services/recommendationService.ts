import prisma from '../config/prisma';
import { YouTubeService } from './youtubeService';
import { JamendoService } from './jamendoService';

export interface SuggestionsResponse {
  recommendations: any[]; // Primary list for "Recommended for you"
  sections: {
    title: string;
    description: string;
    tracks: any[];
  }[];
}

export class RecommendationService {
  /**
   * Computes personalized recommendations based on the user's listening history, liked songs, and activity.
   * If user is unauthenticated or has low activity, falls back cleanly to trending music & curated popular tracks.
   */
  public static async getPersonalizedSuggestions(userId?: string): Promise<SuggestionsResponse> {
    const sections: { title: string; description: string; tracks: any[] }[] = [];
    const seenTrackIds = new Set<string>();

    let userGenres: string[] = [];
    let userArtistIds: string[] = [];
    let lastPlayedTrack: any = null;

    if (userId) {
      // 1. Fetch user recently played tracks
      const recentPlayed = await prisma.recentlyPlayed.findMany({
        where: { userId },
        take: 12,
        orderBy: { playedAt: 'desc' },
        include: {
          track: {
            include: {
              artist: { select: { id: true, name: true, imageUrl: true } },
              album: { select: { id: true, title: true, coverUrl: true } },
            },
          },
        },
      });

      // 2. Fetch user liked tracks
      const likedTracks = await prisma.likedTrack.findMany({
        where: { userId },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          track: {
            include: {
              artist: { select: { id: true, name: true, imageUrl: true } },
              album: { select: { id: true, title: true, coverUrl: true } },
            },
          },
        },
      });

      // Collect user preferences
      recentPlayed.forEach((r) => {
        if (r.track) {
          seenTrackIds.add(r.trackId);
          if (!lastPlayedTrack) lastPlayedTrack = r.track;
          if (r.track.genre) userGenres.push(r.track.genre);
          if (r.track.artistId) userArtistIds.push(r.track.artistId);
        }
      });

      likedTracks.forEach((l) => {
        if (l.track) {
          seenTrackIds.add(l.trackId);
          if (l.track.genre) userGenres.push(l.track.genre);
          if (l.track.artistId) userArtistIds.push(l.track.artistId);
        }
      });
    }

    // Deduplicate genres and artists
    userGenres = Array.from(new Set(userGenres.filter(Boolean)));
    userArtistIds = Array.from(new Set(userArtistIds.filter(Boolean)));

    // 3. Query "Because you listened to [Track/Artist]" if we have recent history
    if (lastPlayedTrack) {
      const becauseTracks = await prisma.track.findMany({
        where: {
          OR: [
            { artistId: lastPlayedTrack.artistId },
            ...(lastPlayedTrack.genre ? [{ genre: lastPlayedTrack.genre }] : []),
          ],
          id: { not: lastPlayedTrack.id },
        },
        take: 8,
        include: {
          artist: { select: { id: true, name: true, imageUrl: true } },
          album: { select: { id: true, title: true, coverUrl: true } },
        },
      });

      if (becauseTracks.length > 0) {
        sections.push({
          title: `Because you listened to ${lastPlayedTrack.artist?.name || lastPlayedTrack.title}`,
          description: `Similar vibes and related tracks in ${lastPlayedTrack.genre || 'Music'}`,
          tracks: becauseTracks.map((t) => ({ ...t, source: t.id.startsWith('jamendo-') ? 'jamendo' : 'local' })),
        });
      }
    }

    // 4. Query "You might also like" (Matching user genres or artists)
    if (userGenres.length > 0 || userArtistIds.length > 0) {
      const genreOrArtistTracks = await prisma.track.findMany({
        where: {
          OR: [
            ...(userGenres.length > 0 ? [{ genre: { in: userGenres } }] : []),
            ...(userArtistIds.length > 0 ? [{ artistId: { in: userArtistIds } }] : []),
          ],
        },
        take: 10,
        orderBy: { playCount: 'desc' },
        include: {
          artist: { select: { id: true, name: true, imageUrl: true } },
          album: { select: { id: true, title: true, coverUrl: true } },
        },
      });

      if (genreOrArtistTracks.length > 0) {
        sections.push({
          title: 'You might also like',
          description: 'Hand-picked sounds curated according to your musical taste',
          tracks: genreOrArtistTracks.map((t) => ({ ...t, source: t.id.startsWith('jamendo-') ? 'jamendo' : 'local' })),
        });
      }
    }

    // 5. Fetch "Trending Now" from YouTube Music
    let trendingYouTube: any[] = [];
    try {
      trendingYouTube = await YouTubeService.getTrendingMusic(10);
    } catch (e) {
      console.warn('Failed to fetch trending music in recommendation service:', e);
    }

    if (trendingYouTube.length > 0) {
      sections.push({
        title: 'Trending Now',
        description: 'The hottest tracks trending on music charts today',
        tracks: trendingYouTube,
      });
    }

    // 6. Fetch "Discover something new" (Fresh catalog and popular tracks)
    const freshCatalog = await prisma.track.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        artist: { select: { id: true, name: true, imageUrl: true } },
        album: { select: { id: true, title: true, coverUrl: true } },
      },
    });

    if (freshCatalog.length > 0) {
      sections.push({
        title: 'Discover something new',
        description: 'Explore new additions and fresh catalog gems',
        tracks: freshCatalog.map((t) => ({ ...t, source: t.id.startsWith('jamendo-') ? 'jamendo' : 'local' })),
      });
    }

    // Primary Recommendations Row: Blend top picks
    // Mix trending tracks, genre-matched tracks, and popular library tracks
    let primaryList: any[] = [];

    if (sections.length > 0) {
      // Pick top tracks from each section
      sections.forEach((sec) => {
        sec.tracks.slice(0, 3).forEach((tr) => {
          if (!primaryList.some((p) => p.id === tr.id)) {
            primaryList.push(tr);
          }
        });
      });
    }

    // Fallback if list is too small
    if (primaryList.length < 8) {
      freshCatalog.forEach((tr) => {
        if (!primaryList.some((p) => p.id === tr.id)) {
          primaryList.push({ ...tr, source: tr.id.startsWith('jamendo-') ? 'jamendo' : 'local' });
        }
      });
    }

    // Check liked status for user
    if (userId) {
      const allTrackIds = [
        ...primaryList.map((t) => t.id),
        ...sections.flatMap((s) => s.tracks.map((t) => t.id)),
      ];
      const likedRecords = await prisma.likedTrack.findMany({
        where: {
          userId,
          trackId: { in: allTrackIds },
        },
        select: { trackId: true },
      });
      const likedSet = new Set(likedRecords.map((l) => l.trackId));

      primaryList = primaryList.map((t) => ({ ...t, isLiked: likedSet.has(t.id) }));
      sections.forEach((s) => {
        s.tracks = s.tracks.map((t) => ({ ...t, isLiked: likedSet.has(t.id) }));
      });
    }

    return {
      recommendations: primaryList.slice(0, 12),
      sections,
    };
  }
}
