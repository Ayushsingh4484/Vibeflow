import { apiClient } from './apiClient';
import { Track } from '../types';

export interface JamendoResponse {
  tracks: Track[];
  total: number;
  source: 'jamendo';
  cached?: boolean;
}

export const jamendoService = {
  /**
   * Get popular / trending tracks from Jamendo
   */
  getPopular: (limit: number = 20) =>
    apiClient.get<JamendoResponse>(`/jamendo/popular?limit=${limit}`),

  /**
   * Search Jamendo catalog
   */
  search: (query: string, limit: number = 20) =>
    apiClient.get<JamendoResponse>(`/jamendo/search?q=${encodeURIComponent(query)}&limit=${limit}`),

  /**
   * Fetch tracks by genre / mood
   */
  getByGenre: (genre: string, limit: number = 20) =>
    apiClient.get<JamendoResponse>(`/jamendo/genre/${encodeURIComponent(genre)}?limit=${limit}`),

  /**
   * Fetch generic track list with query options
   */
  getTracks: (params?: { limit?: number; offset?: number; tags?: string; search?: string; boost?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    if (params?.tags) searchParams.set('tags', params.tags);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.boost) searchParams.set('boost', params.boost);
    return apiClient.get<JamendoResponse>(`/jamendo/tracks?${searchParams.toString()}`);
  },

  /**
   * Get single Jamendo track details by ID
   */
  getTrackById: (id: string) =>
    apiClient.get<{ track: Track }>(`/jamendo/tracks/${id}`),
};
