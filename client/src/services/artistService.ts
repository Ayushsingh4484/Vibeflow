import { apiClient } from './apiClient';
import { Artist, Track } from '../types';

export interface CatalogArtistItem {
  id: string;
  name: string;
  category: 'Indian' | 'Punjabi' | 'Bollywood' | 'International' | 'Pop' | 'Hip-Hop' | 'Electronic' | 'Rock';
  region: 'Indian' | 'International';
  bio: string;
  imageUrl: string;
  monthlyListeners?: string;
}

export interface ArtistYouTubePlaylist {
  id: string;
  ytPlaylistId: string;
  title: string;
  description: string;
  coverUrl: string;
  channelTitle: string;
  trackCount: number;
}

export interface DynamicArtistProfile extends Artist {
  category?: string;
  region?: string;
  monthlyListeners?: string;
  playlists?: ArtistYouTubePlaylist[];
}

export const artistService = {
  getArtists: (params?: { limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    return apiClient.get<{ artists: Artist[] }>(`/artists?${query.toString()}`);
  },

  getCatalog: (params?: { category?: string; region?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.region) query.set('region', params.region);
    if (params?.search) query.set('search', params.search);
    return apiClient.get<{ artists: CatalogArtistItem[] }>(`/artists/catalog?${query.toString()}`);
  },

  getDynamicArtist: (nameOrId: string) =>
    apiClient.get<{ artist: DynamicArtistProfile }>(`/artists/details/${encodeURIComponent(nameOrId)}`),

  getPlaylistTracks: (playlistId: string) =>
    apiClient.get<{ tracks: Track[] }>(`/artists/playlist/${encodeURIComponent(playlistId)}`),

  getArtistById: (id: string) =>
    apiClient.get<{ artist: Artist }>(`/artists/${id}`),

  createArtist: (formData: FormData) =>
    apiClient.post<{ artist: Artist }>('/artists', formData),

  updateArtist: (id: string, formData: FormData) =>
    apiClient.put<{ artist: Artist }>(`/artists/${id}`, formData),

  deleteArtist: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/artists/${id}`),
};

