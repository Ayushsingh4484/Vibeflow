import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { artistService, CatalogArtistItem } from '../services/artistService';
import { ArtistAvatar } from '../components/common/ArtistAvatar';
import { usePlayerStore } from '../store/usePlayerStore';
import {
  Search,
  Users,
  Play,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Globe2,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Indian',
  'International',
  'Bollywood',
  'Punjabi',
  'Pop',
  'Hip-Hop',
  'Electronic',
  'Rock',
];

export const ArtistsPage: React.FC = () => {
  const navigate = useNavigate();
  const { playQueue } = usePlayerStore();

  const [artists, setArtists] = useState<CatalogArtistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [playingArtistId, setPlayingArtistId] = useState<string | null>(null);

  useEffect(() => {
    fetchArtists();
  }, [selectedCategory]);

  const fetchArtists = async (search?: string) => {
    setLoading(true);
    try {
      const categoryParam =
        selectedCategory === 'All'
          ? undefined
          : selectedCategory === 'Indian' || selectedCategory === 'International'
          ? undefined
          : selectedCategory;

      const regionParam =
        selectedCategory === 'Indian' || selectedCategory === 'International'
          ? selectedCategory
          : undefined;

      const res = await artistService.getCatalog({
        category: categoryParam,
        region: regionParam,
        search: search !== undefined ? search : searchQuery,
      });

      setArtists(res.artists || []);
    } catch (err) {
      console.error('Failed to load artist catalog:', err);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchArtists(val);
  };

  const handlePlayArtist = async (e: React.MouseEvent, artist: CatalogArtistItem) => {
    e.stopPropagation();
    setPlayingArtistId(artist.id);
    try {
      const res = await artistService.getDynamicArtist(artist.name);
      if (res.artist?.tracks && res.artist.tracks.length > 0) {
        playQueue(res.artist.tracks, 0);
      }
    } catch (err) {
      console.error('Failed to play artist tracks:', err);
    } finally {
      setPlayingArtistId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 mb-1">
            <Users className="w-4 h-4" />
            <span>Discover Music Creators</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Browse Artists
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            Explore world-renowned icons and top Indian chart-toppers. Listen to popular hits, full discographies, and YouTube Music playlists.
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search artists..."
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

      {/* Artists Grid */}
      {loading ? (
        <div className="py-24 text-center text-zinc-400 flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
            Finding popular artists...
          </p>
        </div>
      ) : artists.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center p-8 rounded-3xl bg-white/40 dark:bg-[#16171e]/40 border border-black/5 dark:border-white/5">
          <Users className="w-12 h-12 text-zinc-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No artists found</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-1">
            Try adjusting your search query or selecting a different category filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              fetchArtists('');
            }}
            className="mt-4 px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {artists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => navigate(`/artist/${encodeURIComponent(artist.name)}`)}
              className="group relative p-4 rounded-3xl bg-white dark:bg-[#16171e] hover:bg-zinc-50 dark:hover:bg-[#1d1f2a] border border-black/5 dark:border-white/5 hover:border-red-500/20 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col items-center text-center select-none"
            >
              {/* Circular Portrait with Floating Play Button */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full mb-3 overflow-hidden bg-zinc-800 shadow-lg border-2 border-transparent group-hover:border-red-500/50 transition-colors">
                <ArtistAvatar
                  src={artist.imageUrl}
                  name={artist.name}
                  loading="lazy"
                  imgClassName="group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                {/* Floating Play Button */}
                <button
                  onClick={(e) => handlePlayArtist(e, artist)}
                  title={`Play ${artist.name}`}
                  className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-600/40 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  {playingArtistId === artist.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
              </div>

              {/* Artist Name & Category */}
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-red-500 transition-colors line-clamp-1 w-full">
                {artist.name}
              </h3>

              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] font-semibold text-zinc-400">
                  {artist.category}
                </span>
                <span className="text-zinc-600 dark:text-zinc-500 text-xs">•</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  {artist.region}
                </span>
              </div>

              {artist.monthlyListeners && (
                <span className="text-[10px] font-medium text-zinc-500 mt-1">
                  {artist.monthlyListeners} listeners
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
