import { apiClient } from './apiClient';
import { Track } from '../types';

export const trackService = {
  getTracks: (params?: { genre?: string; artistId?: string; albumId?: string; search?: string; limit?: number; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.genre) query.set('genre', params.genre);
    if (params?.artistId) query.set('artistId', params.artistId);
    if (params?.albumId) query.set('albumId', params.albumId);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.sort) query.set('sort', params.sort);
    return apiClient.get<{ tracks: Track[]; total: number }>(`/tracks?${query.toString()}`);
  },

  getTrackById: (id: string) => apiClient.get<{ track: Track }>(`/tracks/${id}`),

  createTrack: (formData: FormData) =>
    apiClient.post<{ track: Track }>('/tracks', formData),

  updateTrack: (id: string, formData: FormData) =>
    apiClient.put<{ track: Track }>(`/tracks/${id}`, formData),

  deleteTrack: (id: string) => apiClient.delete<{ success: boolean }>(`/tracks/${id}`),

  likeTrack: (id: string, trackData?: Partial<Track>) =>
    apiClient.post<{ success: boolean; isLiked: boolean }>(`/tracks/${id}/like`, trackData),

  unlikeTrack: (id: string) => apiClient.delete<{ success: boolean; isLiked: boolean }>(`/tracks/${id}/like`),

  recordPlay: (id: string) => apiClient.post<{ success: boolean }>(`/tracks/${id}/play`),

  getRecentlyPlayed: () => apiClient.get<{ tracks: Track[] }>('/users/recently-played'),

  getLikedTracks: () => apiClient.get<{ tracks: Track[]; total: number }>('/users/liked-tracks'),
};
