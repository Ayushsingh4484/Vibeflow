import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { playlistService } from '../services/playlistService';
import { trackService } from '../services/trackService';
import { Playlist, Track } from '../types';
import { Card } from '../components/common/Card';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { Plus, Heart, Music, Library, Sparkles } from 'lucide-react';
import { CreatePlaylistModal } from '../components/common/CreatePlaylistModal';

export const LibraryPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { playQueue } = usePlayerStore();
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'playlists' | 'liked'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      playlistService.getUserPlaylists().then((r) => setPlaylists(r.playlists)),
      trackService.getLikedTracks().then((r) => setLikedTracks(r.tracks)),
    ])
      .catch((err) => console.error('Library fetch error:', err))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
          <Library className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Enjoy your Library</h2>
        <p className="text-zinc-400 text-sm max-w-sm">
          Log in to see your saved songs, playlists, podcasts, and artists in one place.
        </p>
        <Link
          to="/login"
          className="mt-2 px-8 py-3 rounded-full font-bold bg-brand-500 hover:bg-brand-400 text-black transition-all shadow-xl hover:scale-105"
        >
          Log in to VibeFlow
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Your Library
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
              activeFilter === 'all'
                ? 'bg-white text-black'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('playlists')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
              activeFilter === 'playlists'
                ? 'bg-white text-black'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => setActiveFilter('liked')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
              activeFilter === 'liked'
                ? 'bg-white text-black'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            Liked Songs
          </button>
        </div>
      </div>

      {/* Grid of Content */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Create New Playlist Card */}
        {(activeFilter === 'all' || activeFilter === 'playlists') && (
          <div
            onClick={() => setIsCreateModalOpen(true)}
            className="group relative aspect-square bg-[#181818]/60 hover:bg-[#282828] p-4 rounded-xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-3 border-2 border-dashed border-zinc-700 hover:border-brand-500 hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-800 group-hover:bg-brand-500 text-zinc-300 group-hover:text-black flex items-center justify-center transition-colors shadow-lg">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-white group-hover:text-brand-400 text-center">
              New Playlist
            </span>
          </div>
        )}

        {/* Liked Songs Special Banner Card */}
        {(activeFilter === 'all' || activeFilter === 'liked') && (
          <div
            onClick={() => navigate('/liked')}
            className="group relative col-span-2 aspect-[2/1] rounded-xl p-5 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <Heart className="w-8 h-8 text-white fill-current animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/80 bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                {likedTracks.length} Songs
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Liked Songs</h3>
              <p className="text-xs text-white/80 font-medium mt-1">
                Your collection of favorite tracks
              </p>
            </div>
          </div>
        )}

        {/* User Playlists */}
        {(activeFilter === 'all' || activeFilter === 'playlists') &&
          playlists.map((pl) => (
            <Card
              key={pl.id}
              id={pl.id}
              title={pl.name}
              subtitle={`${pl._count?.tracks || 0} tracks`}
              imageUrl={pl.coverUrl}
              type="playlist"
              linkTo={`/playlist/${pl.id}`}
              onPlay={() => {
                playlistService.getPlaylistById(pl.id).then((res) => {
                  if (res.playlist.tracks && res.playlist.tracks.length > 0) {
                    playQueue(res.playlist.tracks, 0);
                  }
                });
              }}
            />
          ))}
      </div>

      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(pl) => {
          setPlaylists([pl, ...playlists]);
          navigate(`/playlist/${pl.id}`);
        }}
      />
    </div>
  );
};
