import React, { useState, useEffect } from 'react';
import { searchService } from '../services/searchService';
import { SearchResults, Track } from '../types';
import { Card } from '../components/common/Card';
import { TrackRow } from '../components/common/TrackRow';
import { usePlayerStore } from '../store/usePlayerStore';
import { Play, Search, Compass, Globe, Music, Disc, Sparkles } from 'lucide-react';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';
import { useAuthStore } from '../store/useAuthStore';

interface SearchPageProps {
  searchQuery: string;
  onSearchChange?: (val: string) => void;
}

import { HOME_GENRE_CATEGORIES, GenreCategory } from '../constants/genreCategories';

export const SearchPage: React.FC<SearchPageProps> = ({ searchQuery, onSearchChange }) => {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  // Quick Suggestions
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const { playTrack, playQueue } = usePlayerStore();

  // Fetch Keyword Suggestions as query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults(null);
      setKeywordSuggestions([]);
      return;
    }

    // Fast keyword suggestion fetch
    setSuggestLoading(true);
    searchService
      .getKeywordSuggestions(searchQuery.trim())
      .then((res) => {
        setKeywordSuggestions(res.suggestions || []);
      })
      .catch(() => setKeywordSuggestions([]))
      .finally(() => setSuggestLoading(false));

    // Full search debounce
    const timer = setTimeout(() => {
      setLoading(true);
      searchService
        .search(searchQuery)
        .then((res) => {
          setResults(res);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Search error:', err);
          setLoading(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectQuery = (q: string) => {
    if (onSearchChange) {
      onSearchChange(q);
    } else {
      window.dispatchEvent(new CustomEvent('vibeflow-search', { detail: q }));
    }
  };

  const hasLocalTracks = results?.tracks && results.tracks.length > 0;
  const hasOnlineTracks = results?.onlineTracks && results.onlineTracks.length > 0;
  const hasArtists = results?.artists && results.artists.length > 0;
  const hasAlbums = results?.albums && results.albums.length > 0;
  const hasPlaylists = results?.playlists && results.playlists.length > 0;

  const hasAnyResults =
    results &&
    (hasLocalTracks ||
      hasOnlineTracks ||
      hasArtists ||
      hasAlbums ||
      hasPlaylists ||
      results.topResult);

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Quick Suggestion Chips while searching */}
      {searchQuery.trim() && keywordSuggestions.length > 0 && (
        <section className="flex flex-col gap-2 -mb-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>Keyword Suggestions</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {keywordSuggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectQuery(item)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 text-slate-700 dark:text-zinc-300 border border-black/5 dark:border-white/10 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <Search className="w-3 h-3 opacity-60" />
                <span>{item}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* If no query: display Browse Categories */}
      {!searchQuery.trim() ? (
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Browse All Categories
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {HOME_GENRE_CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                onClick={() => handleSelectQuery(cat.query)}
                className="group relative aspect-square rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-white/10 flex flex-col justify-between p-4 sm:p-5 select-none bg-zinc-900"
              >
                {/* Real Music / Genre Background Image */}
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
                  }}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out brightness-90 group-hover:brightness-100"
                />

                {/* Multi-Stop Dark Gradient Overlay to ensure crisp typography readability */}
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient} opacity-90 group-hover:opacity-80 transition-opacity`} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/80" />

                {/* Subtle Red Brand Glow on Hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-red-600 transition-opacity duration-300 pointer-events-none" />

                {/* Top: Category Title */}
                <div className="relative z-10 flex flex-col items-start">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight drop-shadow-md group-hover:text-red-400 transition-colors">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-300/90 tracking-wide drop-shadow mt-0.5 line-clamp-1">
                    {cat.artistHint}
                  </span>
                </div>

                {/* Bottom Right: Play Button Icon Overlay on hover */}
                <div className="relative z-10 self-end">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-lg shadow-red-500/40 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : loading ? (
        <div className="py-20 text-center text-zinc-400 flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
            Searching catalog...
          </p>
        </div>
      ) : !hasAnyResults ? (
        <div className="py-20 text-center text-zinc-400 flex flex-col items-center gap-3">
          <Search className="w-12 h-12 text-zinc-400" />
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            No results found for "{searchQuery}"
          </h3>
          <p className="text-sm text-zinc-500 max-w-sm">
            Check your spelling or try searching with different keywords.
          </p>
        </div>
      ) : (
        <>
          {/* Top Result + Local Songs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Result */}
            {results?.topResult && (
              <div className="lg:col-span-5 flex flex-col gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Top Result
                </h2>
                <div className="group relative p-6 rounded-3xl bg-white dark:bg-[#1c1d24] hover:bg-zinc-50 dark:hover:bg-[#252632] border border-black/5 dark:border-white/5 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col gap-4">
                  {results.topResult.type === 'track' && (
                    <>
                      {(results.topResult.data.artworkUrl || results.topResult.data.coverUrl) ? (
                        <img
                          src={(results.topResult.data.artworkUrl || results.topResult.data.coverUrl)!}
                          alt={results.topResult.data.title}
                          className="w-24 h-24 rounded-2xl object-cover shadow-xl bg-zinc-800"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-zinc-800 flex items-center justify-center">
                          <Music className="w-10 h-10 text-zinc-500" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white truncate">
                            {results.topResult.data.title}
                          </h3>
                          {results.topResult.data.source === 'jamendo' && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/20">
                              Jamendo
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                          Song • {results.topResult.data.artist?.name || 'Artist'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (results?.topResult?.data) {
                            playTrack(results.topResult.data, [
                              ...(results.tracks || []),
                              ...(results.onlineTracks || []),
                            ]);
                          }
                        }}
                        className="absolute bottom-6 right-6 w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-500/30 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95"
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </button>
                    </>
                  )}

                  {results.topResult.type === 'artist' && (
                    <>
                      {results.topResult.data.imageUrl ? (
                        <img
                          src={results.topResult.data.imageUrl}
                          alt={results.topResult.data.name}
                          className="w-24 h-24 rounded-full object-cover shadow-xl"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center">
                          <Music className="w-10 h-10 text-zinc-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white truncate">
                          {results.topResult.data.name}
                        </h3>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/5 dark:bg-white/10 text-slate-700 dark:text-zinc-200 mt-2">
                          Artist
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Local Songs Column */}
            {hasLocalTracks && (
              <div className={`${results?.topResult ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col gap-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-red-500" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Songs
                    </h2>
                  </div>
                  <button
                    onClick={() => playQueue(results.tracks, 0)}
                    className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
                  >
                    Play All
                  </button>
                </div>
                <div className="flex flex-col gap-1 bg-white dark:bg-[#16171e] rounded-3xl p-2 border border-black/5 dark:border-white/5 shadow-sm">
                  {results.tracks.slice(0, 4).map((track, idx) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      index={idx}
                      allTracks={results.tracks}
                      onOpenAddToPlaylist={(t) => setSelectedTrackForPlaylist(t)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Online Music Section (YouTube & Jamendo Catalog) */}
          {hasOnlineTracks && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-red-500" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Online & YouTube Music
                  </h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                    Online Catalog
                  </span>
                </div>
                <button
                  onClick={() => playQueue(results.onlineTracks!, 0)}
                  className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
                >
                  Play All Online
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-white dark:bg-[#16171e] rounded-3xl p-3 border border-black/5 dark:border-white/5 shadow-sm">
                {results.onlineTracks!.map((track, idx) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={idx}
                    allTracks={results.onlineTracks!}
                    onOpenAddToPlaylist={(t) => setSelectedTrackForPlaylist(t)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Artists Section */}
          {hasArtists && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Artists
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {results.artists.map((art) => (
                  <Card
                    key={art.id}
                    id={art.id}
                    title={art.name}
                    subtitle="Artist"
                    imageUrl={art.imageUrl}
                    type="artist"
                    linkTo={`/artist/${encodeURIComponent(art.name)}`}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
