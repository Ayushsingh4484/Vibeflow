import React, { useState, useEffect } from 'react';
import { trackService } from '../services/trackService';
import { Track, SuggestionSection } from '../types';
import { Card } from '../components/common/Card';
import { TrackTable } from '../components/common/TrackTable';
import { CardSkeleton, TrackRowSkeleton } from '../components/common/Skeleton';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { Sparkles, Play, Shuffle, Compass, Flame, HeartHandshake, Disc3, RefreshCw } from 'lucide-react';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';

export const SuggestionsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [sections, setSections] = useState<SuggestionSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(18);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  const { playTrack, playQueue, toggleShuffle } = usePlayerStore();
  const { isAuthenticated, user } = useAuthStore();

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await trackService.getSuggestions();
      setRecommendations(res.recommendations || []);
      setSections(res.sections || []);
    } catch (err: any) {
      console.error('Failed to load suggestions:', err);
      setError('Unable to load personalized recommendations at this moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [isAuthenticated]);

  const allSuggestedTracks = [
    ...recommendations,
    ...sections.flatMap((s) => s.tracks),
  ].filter((track, index, self) => index === self.findIndex((t) => t.id === track.id));

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 max-w-7xl mx-auto select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/25">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Suggestions for you
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              {isAuthenticated
                ? `Personalized for ${user?.name || 'you'} based on your recent activity, favorites, and music taste`
                : 'Curated mix of chart-topping releases, trending sounds, and discovered music'}
            </p>
          </div>
        </div>

        {allSuggestedTracks.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => playQueue(allSuggestedTracks, 0)}
              className="px-5 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-red-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play All</span>
            </button>
            <button
              onClick={() => {
                toggleShuffle();
                playQueue(allSuggestedTracks, 0);
              }}
              className="p-2.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-slate-700 dark:text-zinc-300 transition-all hover:scale-105 active:scale-95"
              title="Shuffle suggestions"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={fetchSuggestions}
              className="p-2.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-slate-700 dark:text-zinc-300 transition-all hover:scale-105 active:scale-95"
              title="Refresh suggestions"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <TrackRowSkeleton />
            <TrackRowSkeleton />
            <TrackRowSkeleton />
          </div>
        </div>
      ) : error ? (
        /* Error State */
        <div className="py-16 text-center flex flex-col items-center gap-4 bg-white/50 dark:bg-[#16171e]/50 rounded-3xl p-8 border border-black/5 dark:border-white/5">
          <Compass className="w-12 h-12 text-zinc-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{error}</h3>
          <button
            onClick={fetchSuggestions}
            className="px-5 py-2 rounded-full bg-red-500 text-white font-bold text-xs"
          >
            Try Again
          </button>
        </div>
      ) : allSuggestedTracks.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center flex flex-col items-center gap-3 bg-white/50 dark:bg-[#16171e]/50 rounded-3xl p-8 border border-black/5 dark:border-white/5">
          <Disc3 className="w-12 h-12 text-zinc-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No suggestions yet</h3>
          <p className="text-xs text-zinc-500 max-w-sm">
            Start playing songs, exploring artists, or liking tracks to build your personalized taste profile!
          </p>
        </div>
      ) : (
        /* Content */
        <div className="flex flex-col gap-10">
          {/* Main Recommendations Grid */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-red-500" />
                  Top Recommended
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Highest confidence matches tailored to your sound
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allSuggestedTracks.slice(0, visibleCount).map((track) => (
                <Card
                  key={track.id}
                  id={track.id}
                  title={track.title}
                  subtitle={track.artist?.name || 'Artist'}
                  imageUrl={track.artworkUrl || track.coverUrl}
                  type="track"
                  source={track.source}
                  onPlay={() => playTrack(track, allSuggestedTracks)}
                />
              ))}
            </div>

            {visibleCount < allSuggestedTracks.length && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="px-6 py-2.5 rounded-full bg-white dark:bg-[#1c1d24] hover:bg-zinc-100 dark:hover:bg-[#252632] text-xs font-extrabold text-slate-800 dark:text-zinc-200 border border-black/5 dark:border-white/10 shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  Load More Suggestions ({allSuggestedTracks.length - visibleCount} more)
                </button>
              </div>
            )}
          </section>

          {/* Contextual Sections (e.g. "Because you listened to...", "Trending Now", "You might also like") */}
          {sections.map((section, idx) => {
            if (!section.tracks || section.tracks.length === 0) return null;

            return (
              <section key={idx} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      {section.title.includes('Trending') ? (
                        <Flame className="w-5 h-5 text-red-500" />
                      ) : section.title.includes('Because') ? (
                        <HeartHandshake className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Compass className="w-5 h-5 text-indigo-500" />
                      )}
                      {section.title}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {section.description}
                    </p>
                  </div>
                  <button
                    onClick={() => playQueue(section.tracks, 0)}
                    className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
                  >
                    Play All
                  </button>
                </div>

                <div className="bg-white dark:bg-[#16171e] rounded-2xl md:rounded-3xl p-2 md:p-3 border border-black/5 dark:border-white/5 shadow-sm">
                  <TrackTable
                    tracks={section.tracks}
                    onOpenAddToPlaylist={(t) => setSelectedTrackForPlaylist(t)}
                  />
                </div>
              </section>
            );
          })}
        </div>
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

export default SuggestionsPage;
