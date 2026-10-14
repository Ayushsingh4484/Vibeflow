import { apiClient } from './apiClient';
import { Playlist, PrebuiltPlaylist, Track } from '../types';

export const playlistService = {
  getPlaylists: (limit: number = 20) =>
    apiClient.get<{ playlists: Playlist[] }>(`/playlists?limit=${limit}`),

  getPrebuiltPlaylists: (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    return apiClient.get<{ playlists: PrebuiltPlaylist[] }>(`/playlists/prebuilt?${query.toString()}`);
  },

  getPrebuiltPlaylistById: (id: string) =>
    apiClient.get<{ playlist: Playlist }>(`/playlists/prebuilt/${encodeURIComponent(id)}`),

  savePrebuiltPlaylist: (id: string) =>
    apiClient.post<{ success: boolean; playlist: Playlist }>(`/playlists/prebuilt/${encodeURIComponent(id)}/save`, {}),

  getUserPlaylists: () =>
    apiClient.get<{ playlists: Playlist[] }>('/playlists/user/me'),

  getPlaylistById: (id: string) =>
    apiClient.get<{ playlist: Playlist }>(`/playlists/${id}`),

  createPlaylist: (formData: FormData | { name: string; description?: string }) =>
    apiClient.post<{ playlist: Playlist }>('/playlists', formData),

  updatePlaylist: (id: string, formData: FormData | { name?: string; description?: string }) =>
    apiClient.put<{ playlist: Playlist }>(`/playlists/${id}`, formData),

  deletePlaylist: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/playlists/${id}`),

  addTrackToPlaylist: (playlistId: string, trackId: string, trackData?: Partial<Track>) =>
    apiClient.post<{ success: boolean }>(`/playlists/${playlistId}/tracks`, { trackId, ...trackData }),

  removeTrackFromPlaylist: (playlistId: string, trackId: string) =>
    apiClient.delete<{ success: boolean }>(`/playlists/${playlistId}/tracks/${trackId}`),

  reorderTracks: (playlistId: string, trackIds: string[]) =>
    apiClient.put<{ success: boolean }>(`/playlists/${playlistId}/reorder`, { trackIds }),
};

