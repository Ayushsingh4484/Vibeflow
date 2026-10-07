import { apiClient } from './apiClient';
import { Album } from '../types';

export const albumService = {
  getAlbums: (params?: { limit?: number; search?: string; artistId?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.artistId) query.set('artistId', params.artistId);
    return apiClient.get<{ albums: Album[] }>(`/albums?${query.toString()}`);
  },

  getAlbumById: (id: string) =>
    apiClient.get<{ album: Album }>(`/albums/${id}`),

  createAlbum: (formData: FormData) =>
    apiClient.post<{ album: Album }>('/albums', formData),

  updateAlbum: (id: string, formData: FormData) =>
    apiClient.put<{ album: Album }>(`/albums/${id}`, formData),

  deleteAlbum: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/albums/${id}`),
};
