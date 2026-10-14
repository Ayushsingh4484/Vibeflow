import React, { useState, useEffect } from 'react';
import { playlistService } from '../services/playlistService';
import { PrebuiltPlaylist, Playlist } from '../types';
import { PlaylistCard } from '../components/common/PlaylistCard';
import { usePlayerStore } from '../store/usePlayerStore';
import { Sparkles, Search, Music2, Compass } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Hits & Charts',
  'Mood & Chill',
  'Party & Workout',
  'Desi & Regional',
  'Focus & Study',
  'Classics & Rock',
  'Electronic',
];

export const PlaylistsPage: React.FC = () => {
  const [playlists, setPlaylists] = useState<PrebuiltPlaylist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [playingPlaylistId, setPlayingPlaylistId] = useState<string | null>(null);

  const { playQueue } = usePlayerStore();

  const fetchPlaylists = async (category: string, search: string) => {
    setLoading(true);
    try {
      const res = await playlistService.getPrebuiltPlaylists({
        category: category !== 'All' ? category : undefined,
        search: search.trim() || undefined,
      });
      setPlaylists(res.playlists || []);
    } catch (err) {
      console.error('Failed to load prebuilt playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists(selectedCategory, searchQuery);
  }, [selectedCategory]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchPlaylists(selectedCategory, val);
  };

  const handlePlayPlaylist = async (e: React.MouseEvent, pl: PrebuiltPlaylist | Playlist) => {
    e.stopPropagation();
    setPlayingPlaylistId(pl.id);
    try {
      const res = await playlistService.getPrebuiltPlaylistById(pl.id);
      if (res.playlist?.tracks && res.playlist.tracks.length > 0) {
        playQueue(res.playlist.tracks, 0);
      }
    } catch (err) {
      console.error('Failed to play prebuilt playlist:', err);
    } finally {
      setPlayingPlaylistId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 mb-1">
            <Compass className="w-4 h-4" />
            <span>Curated Soundtracks</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Made for Your Mood</span>
            <Sparkles className="w-6 h-6 text-red-500 animate-pulse" />
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            Your next favorite playlist is waiting. Stream high-energy workouts, late-night lo-fi, chart-topping hits, and regional bangers.
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search mood or genre..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white dark:bg-[#1c1d24] border border-black/5 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-red-500 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-red-600 text-white shadow-md shadow-red-600/25 scale-105'
                : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 border border-black/5 dark:border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Playlists Grid */}
      {loading ? (
        <div className="py-24 text-center text-zinc-400 flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
            Finding curated playlists...
          </p>
        </div>
      ) : playlists.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center p-8 rounded-3xl bg-white/40 dark:bg-[#16171e]/40 border border-black/5 dark:border-white/5">
          <Music2 className="w-12 h-12 text-zinc-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No playlists found</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-1">
            Try adjusting your search query or selecting a different category filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              fetchPlaylists('All', '');
            }}
            className="mt-4 px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              isPlaying={playingPlaylistId === playlist.id}
              onPlay={handlePlayPlaylist}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;
