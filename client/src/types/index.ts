export type MusicSource = 'local' | 'jamendo';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatarUrl?: string;
  createdAt: string;
  _count?: {
    playlists?: number;
    likedTracks?: number;
  };
}

export interface Artist {
  id: string;
  name: string;
  bio?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
  albums?: Album[];
  tracks?: Track[];
  _count?: {
    tracks: number;
    albums: number;
  };
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  coverUrl?: string | null;
  releaseDate?: string | null;
  createdAt?: string;
  artist?: Artist;
  tracks?: Track[];
  totalDuration?: number;
  _count?: {
    tracks: number;
  };
}

export interface Track {
  id: string;
  source?: MusicSource;
  title: string;
  artistId?: string;
  albumId?: string | null;
  audioUrl: string;
  coverUrl?: string | null;
  artworkUrl?: string | null;
  duration: number; // in seconds
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
  isLiked?: boolean;
  playedAt?: string;
  addedAt?: string;
  position?: number;
  externalUrl?: string;
  licenseUrl?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  userId: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
  tracks?: Track[];
  trackCount?: number;
  totalDuration?: number;
  _count?: {
    tracks: number;
  };
}

export interface SearchResults {
  query: string;
  topResult: {
    type: 'artist' | 'album' | 'track' | 'playlist';
    data: any;
  } | null;
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  onlineTracks?: Track[];
}

export interface AdminStats {
  totalUsers: number;
  totalTracks: number;
  totalArtists: number;
  totalAlbums: number;
  totalPlaylists: number;
  totalPlays: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
