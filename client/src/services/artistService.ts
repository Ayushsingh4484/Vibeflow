import { apiClient } from './apiClient';
import { Artist } from '../types';

export const artistService = {
  getArtists: (params?: { limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    return apiClient.get<{ artists: Artist[] }>(`/artists?${query.toString()}`);
  },

  getArtistById: (id: string) =>
    apiClient.get<{ artist: Artist }>(`/artists/${id}`),

  createArtist: (formData: FormData) =>
    apiClient.post<{ artist: Artist }>('/artists', formData),

  updateArtist: (id: string, formData: FormData) =>
    apiClient.put<{ artist: Artist }>(`/artists/${id}`, formData),

  deleteArtist: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/artists/${id}`),
};
