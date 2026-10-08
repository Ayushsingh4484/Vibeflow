import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { playlistService } from '../services/playlistService';
import { trackService } from '../services/trackService';
import { Playlist, Track } from '../types';
import { Card } from '../components/common/Card';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { Plus, Heart, Library } from 'lucide-react';
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
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
          <Library className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Enjoy your Library</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm">
          Log in to see your saved songs, playlists, and favorite artists in one place.
        </p>
        <Link
          to="/login"
          className="mt-2 px-8 py-3 rounded-full font-bold bg-red-500 hover:bg-red-600 text-white transition-all shadow-xl shadow-red-500/25 hover:scale-105"
        >
          Log in to VibeFlow
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header & Segmented Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          Your Library
        </h1>

        <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-full border border-black/5 dark:border-white/5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('playlists')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'playlists'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => setActiveFilter('liked')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'liked'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
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
            className="group relative aspect-square bg-white dark:bg-[#1c1d24] hover:bg-zinc-50 dark:hover:bg-[#252632] p-4 rounded-3xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-red-500 dark:hover:border-red-500 hover:-translate-y-1.5 shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 group-hover:bg-red-500 text-zinc-600 dark:text-zinc-300 group-hover:text-white flex items-center justify-center transition-colors shadow-md">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-red-500 text-center">
              New Playlist
            </span>
          </div>
        )}

        {/* Liked Songs Special Banner Card */}
        {(activeFilter === 'all' || activeFilter === 'liked') && (
          <div
            onClick={() => navigate('/liked')}
            className="group relative col-span-2 aspect-[2/1] rounded-3xl p-6 bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden hover:-translate-y-1.5"
          >
            <div className="flex items-center justify-between">
              <Heart className="w-8 h-8 text-white fill-current animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-white bg-black/20 px-3 py-1 rounded-full backdrop-blur-md">
                {likedTracks.length} Songs
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Liked Songs</h3>
              <p className="text-xs text-white/90 font-medium mt-1">
                Your collection of saved favorite tracks
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
