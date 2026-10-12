import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  Volume1,
  Search,
  Sparkles,
  Radio,
  Compass,
  X,
  Music,
  Maximize2,
  Minimize2,
  ListMusic,
} from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { formatTime } from '../../utils/format';
import { Track } from '../../types';
import { trackService } from '../../services/trackService';
import { searchService } from '../../services/searchService';
import { jamendoService } from '../../services/jamendoService';
import { useAuthStore } from '../../store/useAuthStore';

export const NowPlayingModal: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    isNowPlayingOpen,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    setIsNowPlayingOpen,
    toggleLikeCurrentTrack,
    playTrack,
    queue,
    queueIndex,
  } = usePlayerStore();

  const { isAuthenticated } = useAuthStore();

  // Browsing panel states (Right 40%)
  const [activeTab, setActiveTab] = useState<'recommended' | 'recent' | 'queue' | 'search'>('recommended');
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);

  // Search state within browsing panel
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  // Load recommendations & recent activity when split screen opens
  useEffect(() => {
    if (!isNowPlayingOpen) return;

    let isCancelled = false;
    setBrowseLoading(true);

    const loadData = async () => {
      try {
        const [suggRes, jamendoRes] = await Promise.all([
          trackService.getSuggestions().catch(() => ({ recommendations: [], sections: [] })),
          jamendoService.getPopular(10).catch(() => ({ tracks: [] })),
        ]);

        if (isCancelled) return;

        const combined = [
          ...(suggRes.recommendations || []),
          ...(jamendoRes.tracks || []),
        ];

        // Deduplicate tracks by id
        const seen = new Set<string>();
        const uniqueRecs: Track[] = [];
        for (const t of combined) {
          if (!seen.has(t.id)) {
            seen.add(t.id);
            uniqueRecs.push(t);
          }
        }

        setRecommendations(uniqueRecs);

        if (isAuthenticated) {
          trackService
            .getRecentlyPlayed()
            .then((res) => {
              if (!isCancelled) setRecentTracks(res.tracks || []);
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error('Failed to load split screen browsing data:', err);
      } finally {
        if (!isCancelled) setBrowseLoading(false);
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [isNowPlayingOpen, isAuthenticated]);

  // Search effect in browsing panel
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchSuggestions([]);
      return;
    }

    // Quick suggestions
    searchService
      .getKeywordSuggestions(searchQuery.trim())
      .then((res) => setSearchSuggestions(res.suggestions || []))
      .catch(() => setSearchSuggestions([]));

    // Full search
    const timer = setTimeout(() => {
      setSearchLoading(true);
      searchService
        .search(searchQuery.trim())
        .then((res) => {
          const list = [...(res.tracks || []), ...(res.onlineTracks || [])];
          setSearchResults(list);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isNowPlayingOpen || !currentTrack) return null;

  const artwork =
    currentTrack.artworkUrl ||
    currentTrack.coverUrl ||
    `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(currentTrack.title)}`;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  const upcomingQueue = queue.slice(queueIndex + 1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white animate-slide-up select-none overflow-hidden">
      {/* Dynamic Ambient Background Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-25 scale-125 transition-all duration-700 pointer-events-none"
        style={{ backgroundImage: `url(${artwork})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/85 to-zinc-950 pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-white/10 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNowPlayingOpen(false)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            title="Minimize player"
          >
            <Minimize2 className="w-4 h-4 text-zinc-300" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-tight text-white">Vibe<span className="text-red-500">Flow</span></span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-medium hidden sm:inline-block">
              Split Screen Player
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium hidden md:inline-block">
            {currentTrack.album?.title ? `Album: ${currentTrack.album.title}` : 'Now Playing'}
          </span>
          <button
            onClick={() => setIsNowPlayingOpen(false)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-zinc-300 flex items-center justify-center transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Split-Screen Main Layout: Desktop 60% Left / 40% Right */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT PANEL — 60% WIDTH: NOW PLAYING FULL CONTROLS         */}
        {/* ========================================================= */}
        <section className="w-full lg:w-[60%] flex flex-col justify-between px-6 sm:px-12 py-6 sm:py-8 overflow-y-auto lg:border-r border-white/10 lg:shadow-2xl min-h-0">
          <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full">
            {/* Album Artwork */}
            <div className="relative aspect-square w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group mb-6 transition-all">
              <img
                src={artwork}
                alt={currentTrack.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {currentTrack.source === 'jamendo' && (
                <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30">
                  Jamendo
                </span>
              )}
              {currentTrack.source === 'youtube' && (
                <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-red-600/90 backdrop-blur-md text-white border border-red-500/40">
                  YouTube
                </span>
              )}
            </div>

            {/* Track Title, Artist & Like Action */}
            <div className="w-full flex items-center justify-between mb-4">
              <div className="flex flex-col min-w-0 pr-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight truncate text-white">
                  {currentTrack.title}
                </h1>
                <p className="text-sm sm:text-base text-zinc-400 font-medium truncate mt-1">
                  {currentTrack.artist?.name || 'Unknown Artist'}
                </p>
              </div>

              <button
                onClick={toggleLikeCurrentTrack}
                className={`p-3 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all shrink-0 ${
                  currentTrack.isLiked ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:text-white'
                }`}
                title={currentTrack.isLiked ? 'Unlike' : 'Like'}
              >
                <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${currentTrack.isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Interactive Progress Bar */}
            <div className="w-full flex flex-col gap-1.5 my-2">
              <div className="relative group flex items-center h-4 cursor-pointer">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer appearance-none accent-red-500"
                  style={{
                    background: `linear-gradient(to right, #ef4444 ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="w-full flex items-center justify-between mt-4 px-2 sm:px-6">
              <button
                onClick={toggleShuffle}
                className={`p-2 transition-colors relative ${
                  shuffle ? 'text-red-500' : 'text-zinc-400 hover:text-white'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5 sm:w-6 sm:h-6" />
                {shuffle && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
              </button>

              <button
                onClick={prevTrack}
                className="p-3 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all"
                title="Previous"
              >
                <SkipBack className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-all"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current text-white" />
                ) : (
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current text-white ml-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="p-3 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all"
                title="Next"
              >
                <SkipForward className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-2 transition-colors relative ${
                  repeat !== 'off' ? 'text-red-500' : 'text-zinc-400 hover:text-white'
                }`}
                title={`Repeat: ${repeat}`}
              >
                {repeat === 'one' ? (
                  <Repeat1 className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Repeat className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
                {repeat !== 'off' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
              </button>
            </div>

            {/* Volume Control Bar */}
            <div className="w-full flex items-center justify-center gap-3 mt-6 px-4 py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 max-w-xs">
              <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-40 sm:w-48 h-1.5 bg-white/20 rounded-full cursor-pointer appearance-none accent-red-500"
                style={{
                  background: `linear-gradient(to right, #ef4444 ${volumePercent}%, rgba(255,255,255,0.2) ${volumePercent}%)`,
                }}
              />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* RIGHT PANEL — 40% WIDTH: MUSIC BROWSING SECTION           */}
        {/* ========================================================= */}
        <aside className="w-full lg:w-[40%] flex flex-col bg-black/40 backdrop-blur-2xl overflow-hidden min-h-0">
          {/* Browsing Tabs & Quick Search */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col gap-3 shrink-0 bg-white/[0.02]">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search music while listening..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'search') setActiveTab('search');
                }}
                className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 text-xs sm:text-sm text-white placeholder-zinc-400 pl-9 pr-8 py-2 rounded-xl border border-white/10 focus:border-red-500 focus:outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Keyword suggestions pills if searching */}
            {searchQuery.trim() && searchSuggestions.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {searchSuggestions.slice(0, 5).map((kw, i) => (
                  <button
                    key={i}
                    onClick={() => setSearchQuery(kw)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 hover:bg-red-500 text-zinc-300 hover:text-white transition-all whitespace-nowrap shrink-0"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            )}

            {/* Browsing Navigation Tabs */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('recommended')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'recommended'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Suggested</span>
              </button>

              <button
                onClick={() => setActiveTab('recent')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'recent'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Recent</span>
              </button>

              <button
                onClick={() => setActiveTab('queue')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'queue'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>Queue ({upcomingQueue.length})</span>
              </button>
            </div>
          </div>

          {/* Independent Vertical Scroll Area for Song List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-2 min-h-0">
            {/* 1. SEARCH RESULTS TAB */}
            {activeTab === 'search' && (
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  {searchLoading ? 'Searching...' : `Results for "${searchQuery}"`}
                </div>

                {searchLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
                    <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Finding tracks...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 text-xs">
                    No songs found matching your search.
                  </div>
                ) : (
                  searchResults.map((track) => (
                    <BrowsingSongItem
                      key={track.id}
                      track={track}
                      isCurrent={currentTrack.id === track.id}
                      isPlaying={isPlaying && currentTrack.id === track.id}
                      onSelect={() => playTrack(track, searchResults)}
                    />
                  ))
                )}
              </div>
            )}

            {/* 2. RECOMMENDED TAB */}
            {activeTab === 'recommended' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  <span>Recommended for you</span>
                  <span className="text-[10px] text-zinc-500 lowercase">personalized mix</span>
                </div>

                {browseLoading && recommendations.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
                    <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Curating suggestions...</span>
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 text-xs">
                    Start playing more songs to generate tailored recommendations.
                  </div>
                ) : (
                  recommendations.map((track) => (
                    <BrowsingSongItem
                      key={track.id}
                      track={track}
                      isCurrent={currentTrack.id === track.id}
                      isPlaying={isPlaying && currentTrack.id === track.id}
                      onSelect={() => playTrack(track, recommendations)}
                    />
                  ))
                )}
              </div>
            )}

            {/* 3. RECENT ACTIVITY TAB */}
            {activeTab === 'recent' && (
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Recently Played History
                </div>

                {recentTracks.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 text-xs">
                    No recent playback history found.
                  </div>
                ) : (
                  recentTracks.map((track) => (
                    <BrowsingSongItem
                      key={track.id}
                      track={track}
                      isCurrent={currentTrack.id === track.id}
                      isPlaying={isPlaying && currentTrack.id === track.id}
                      onSelect={() => playTrack(track, recentTracks)}
                    />
                  ))
                )}
              </div>
            )}

            {/* 4. UPCOMING QUEUE TAB */}
            {activeTab === 'queue' && (
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Up Next in Queue
                </div>

                {upcomingQueue.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 text-xs">
                    No more tracks queued up. Select any song to build your queue.
                  </div>
                ) : (
                  upcomingQueue.map((track, i) => (
                    <BrowsingSongItem
                      key={`${track.id}-${i}`}
                      track={track}
                      isCurrent={false}
                      isPlaying={false}
                      onSelect={() => playTrack(track, queue)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

interface BrowsingSongItemProps {
  track: Track;
  isCurrent: boolean;
  isPlaying: boolean;
  onSelect: () => void;
}

const BrowsingSongItem: React.FC<BrowsingSongItemProps> = ({
  track,
  isCurrent,
  isPlaying,
  onSelect,
}) => {
  const artwork =
    track.artworkUrl ||
    track.coverUrl ||
    `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(track.title)}`;

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all duration-200 border ${
        isCurrent
          ? 'bg-red-500/15 border-red-500/40 text-red-400 shadow-sm'
          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 text-zinc-200'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
        {/* Square Album Artwork */}
        <div className="relative aspect-square w-11 h-11 rounded-xl overflow-hidden shadow-md bg-zinc-800 shrink-0">
          <img
            src={artwork}
            alt={track.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isCurrent && isPlaying ? (
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-3 bg-red-500 rounded-full animate-bar-1" />
                <span className="w-1 h-3 bg-red-500 rounded-full animate-bar-2" />
                <span className="w-1 h-3 bg-red-500 rounded-full animate-bar-3" />
              </div>
            ) : (
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Title and Artist */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs sm:text-sm font-bold truncate ${
                isCurrent ? 'text-red-400' : 'text-white group-hover:text-red-400 transition-colors'
              }`}
            >
              {track.title}
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 truncate mt-0.5">
            {track.artist?.name || 'Unknown Artist'}
          </span>
        </div>
      </div>

      {/* Duration */}
      <span className="text-[11px] text-zinc-500 font-medium tabular-nums shrink-0">
        {formatTime(track.duration)}
      </span>
    </div>
  );
};
