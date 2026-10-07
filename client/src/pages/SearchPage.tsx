import React, { useState, useEffect } from 'react';
import { searchService } from '../services/searchService';
import { SearchResults, Track } from '../types';
import { Card } from '../components/common/Card';
import { TrackRow } from '../components/common/TrackRow';
import { usePlayerStore } from '../store/usePlayerStore';
import { Play, Search, Compass, Globe, Music, Disc } from 'lucide-react';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';

interface SearchPageProps {
  searchQuery: string;
}

const GENRE_CARDS = [
  { name: 'Electronic', color: 'from-blue-600 to-violet-800' },
  { name: 'Chill', color: 'from-sky-500 to-indigo-700' },
  { name: 'Lo-Fi', color: 'from-amber-600 to-red-800' },
  { name: 'Rock', color: 'from-red-600 to-rose-900' },
  { name: 'Pop', color: 'from-pink-500 to-rose-600' },
  { name: 'Jazz', color: 'from-yellow-600 to-amber-900' },
  { name: 'Ambient', color: 'from-cyan-600 to-blue-800' },
  { name: 'Focus', color: 'from-teal-600 to-emerald-900' },
  { name: 'Workout', color: 'from-orange-500 to-amber-700' },
  { name: 'Acoustic', color: 'from-emerald-700 to-green-900' },
  { name: 'Synthwave', color: 'from-pink-600 to-purple-800' },
  { name: 'Cyberpunk', color: 'from-violet-600 to-fuchsia-900' },
];

export const SearchPage: React.FC<SearchPageProps> = ({ searchQuery }) => {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  const { playTrack, playQueue } = usePlayerStore();

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

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
    <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto">
      {/* If no query, display Browse Categories */}
      {!searchQuery.trim() ? (
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-brand-400" />
            <h2 className="text-2xl font-bold text-white tracking-tight">Browse All Categories</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {GENRE_CARDS.map((cat) => (
              <div
                key={cat.name}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('vibeflow-search', { detail: cat.name }));
                }}
                className={`relative aspect-square rounded-xl p-4 bg-gradient-to-br ${cat.color} overflow-hidden shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer border border-white/10 group`}
              >
                <h3 className="text-lg font-bold text-white tracking-tight group-hover:scale-105 transition-transform">
                  {cat.name}
                </h3>
                <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full bg-white/10 blur-sm" />
              </div>
            ))}
          </div>
        </section>
      ) : loading ? (
        <div className="py-20 text-center text-zinc-400 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Searching local library and Jamendo catalog...</p>
        </div>
      ) : !hasAnyResults ? (
        <div className="py-20 text-center text-zinc-400 flex flex-col items-center gap-3">
          <Search className="w-12 h-12 text-zinc-600" />
          <h3 className="text-lg font-bold text-white">No results found for "{searchQuery}"</h3>
          <p className="text-sm text-zinc-500 max-w-sm">
            Please make sure your words are spelled correctly, or try searching with different keywords.
          </p>
        </div>
      ) : (
        <>
          {/* Top Result + Local Songs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Result */}
            {results?.topResult && (
              <div className="lg:col-span-5 flex flex-col gap-3">
                <h2 className="text-xl font-bold text-white tracking-tight">Top Result</h2>
                <div className="group relative p-6 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col gap-4">
                  {results.topResult.type === 'track' && (
                    <>
                      {(results.topResult.data.artworkUrl || results.topResult.data.coverUrl) ? (
                        <img
                          src={(results.topResult.data.artworkUrl || results.topResult.data.coverUrl)!}
                          alt={results.topResult.data.title}
                          className="w-24 h-24 rounded-xl object-cover shadow-2xl bg-zinc-800"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(results?.topResult?.data?.title || 'track')}`;
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-zinc-800 flex items-center justify-center">
                          <Music className="w-10 h-10 text-zinc-500" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-extrabold text-white truncate">
                            {results.topResult.data.title}
                          </h3>
                          {results.topResult.data.source === 'jamendo' && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                              Jamendo
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400 font-medium mt-1">
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
                        className="absolute bottom-6 right-6 w-12 h-12 bg-brand-500 hover:bg-brand-400 text-black rounded-full flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95"
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
                          className="w-24 h-24 rounded-full object-cover shadow-2xl"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center">
                          <Music className="w-10 h-10 text-zinc-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-extrabold text-white truncate">
                          {results.topResult.data.name}
                        </h3>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-white mt-2">
                          Artist
                        </span>
                      </div>
                    </>
                  )}

                  {results.topResult.type === 'album' && (
                    <>
                      {results.topResult.data.coverUrl ? (
                        <img
                          src={results.topResult.data.coverUrl}
                          alt={results.topResult.data.title}
                          className="w-24 h-24 rounded-xl object-cover shadow-2xl"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-zinc-800 flex items-center justify-center">
                          <Disc className="w-10 h-10 text-zinc-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-extrabold text-white truncate">
                          {results.topResult.data.title}
                        </h3>
                        <p className="text-sm text-zinc-400 font-medium mt-1">
                          Album • {results.topResult.data.artist?.name || 'Artist'}
                        </p>
                      </div>
                    </>
                  )}

                  {results.topResult.type === 'playlist' && (
                    <>
                      {results.topResult.data.coverUrl ? (
                        <img
                          src={results.topResult.data.coverUrl}
                          alt={results.topResult.data.name}
                          className="w-24 h-24 rounded-xl object-cover shadow-2xl"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-zinc-800 flex items-center justify-center">
                          <Disc className="w-10 h-10 text-zinc-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-extrabold text-white truncate">
                          {results.topResult.data.name}
                        </h3>
                        <p className="text-sm text-zinc-400 font-medium mt-1">
                          Playlist • {results.topResult.data.user?.name || 'VibeFlow'}
                        </p>
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
                    <Music className="w-5 h-5 text-brand-400" />
                    <h2 className="text-xl font-bold text-white tracking-tight">Local Music</h2>
                  </div>
                  <button
                    onClick={() => playQueue(results.tracks, 0)}
                    className="text-xs font-bold text-brand-400 hover:text-brand-300 uppercase tracking-wider"
                  >
                    Play All
                  </button>
                </div>
                <div className="flex flex-col gap-1 bg-[#181818]/30 rounded-xl p-2 border border-white/5">
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

          {/* Online Music Section (Jamendo Catalog) */}
          {hasOnlineTracks && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl font-bold text-white tracking-tight">Online Music</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Jamendo Catalog
                  </span>
                </div>
                <button
                  onClick={() => playQueue(results.onlineTracks!, 0)}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wider"
                >
                  Play All Online
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-[#181818]/40 rounded-xl p-3 border border-white/5">
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
              <h2 className="text-xl font-bold text-white tracking-tight">Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {results.artists.map((art) => (
                  <Card
                    key={art.id}
                    id={art.id}
                    title={art.name}
                    subtitle="Artist"
                    imageUrl={art.imageUrl}
                    type="artist"
                    linkTo={`/artist/${art.id}`}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Albums Section */}
          {hasAlbums && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-white tracking-tight">Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {results.albums.map((alb) => (
                  <Card
                    key={alb.id}
                    id={alb.id}
                    title={alb.title}
                    subtitle={alb.artist?.name || 'Album'}
                    imageUrl={alb.coverUrl}
                    type="album"
                    linkTo={`/album/${alb.id}`}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Playlists Section */}
          {hasPlaylists && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-white tracking-tight">Playlists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {results.playlists.map((pl) => (
                  <Card
                    key={pl.id}
                    id={pl.id}
                    title={pl.name}
                    subtitle={pl.description || 'Playlist'}
                    imageUrl={pl.coverUrl}
                    type="playlist"
                    linkTo={`/playlist/${pl.id}`}
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
