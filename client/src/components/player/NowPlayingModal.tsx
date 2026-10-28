import React, { useState, useEffect, useRef } from 'react';
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
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { formatTime, cleanSongTitle, cleanArtistName } from '../../utils/format';
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

  // Mobile slide-up suggestions sheet state & gestures
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [touchDeltaY, setTouchDeltaY] = useState(0);
  const playerTouchStartY = useRef<number | null>(null);
  const sheetTouchStartY = useRef<number | null>(null);

  const handlePlayerTouchStart = (e: React.TouchEvent) => {
    playerTouchStartY.current = e.touches[0].clientY;
  };

  const handlePlayerTouchEnd = (e: React.TouchEvent) => {
    if (playerTouchStartY.current === null) return;
    const deltaY = playerTouchStartY.current - e.changedTouches[0].clientY;
    // Swipe up on mobile opens the suggestion bottom sheet
    if (deltaY > 45) {
      setIsMobileSheetOpen(true);
    }
    playerTouchStartY.current = null;
  };

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    sheetTouchStartY.current = e.touches[0].clientY;
    setTouchDeltaY(0);
  };

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    if (sheetTouchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - sheetTouchStartY.current;
    if (diff > 0) {
      setTouchDeltaY(diff);
    }
  };

  const handleSheetTouchEnd = (e: React.TouchEvent) => {
    if (sheetTouchStartY.current === null) return;
    const diff = e.changedTouches[0].clientY - sheetTouchStartY.current;
    if (diff > 75) {
      setIsMobileSheetOpen(false);
    }
    setTouchDeltaY(0);
    sheetTouchStartY.current = null;
  };

  // Lock body scroll when NowPlayingModal is open
  useEffect(() => {
    if (isNowPlayingOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isNowPlayingOpen]);

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

  const handleSelectTrack = (track: Track, trackList: Track[]) => {
    playTrack(track, trackList);
    setIsMobileSheetOpen(false);
  };

  const browsingContent = (
    <>
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
            className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 text-xs sm:text-sm text-white placeholder-zinc-400 pl-9 pr-8 py-2 rounded-xl border border-white/15 focus:border-red-500 focus:outline-none transition-all shadow-inner backdrop-blur-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="liquid-btn absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
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
                className="liquid-btn px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 hover:bg-red-500 text-zinc-300 hover:text-white transition-all whitespace-nowrap shrink-0 border border-white/10"
              >
                {kw}
              </button>
            ))}
          </div>
        )}

        {/* Browsing Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-black/50 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('recommended')}
            className={`liquid-btn flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'recommended'
                ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-md border-t border-white/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Suggested</span>
          </button>

          <button
            onClick={() => setActiveTab('recent')}
            className={`liquid-btn flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'recent'
                ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-md border-t border-white/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Recent</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`liquid-btn flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'queue'
                ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-md border-t border-white/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
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
                  onSelect={() => handleSelectTrack(track, searchResults)}
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
                  onSelect={() => handleSelectTrack(track, recommendations)}
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
                  onSelect={() => handleSelectTrack(track, recentTracks)}
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
                  onSelect={() => handleSelectTrack(track, queue)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07080d] text-white animate-slide-up select-none overflow-hidden">
      {/* Dynamic Ambient Background Blur with Artwork Refraction */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-125 transition-all duration-700 pointer-events-none"
        style={{ backgroundImage: `url(${artwork})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-[#07080d] pointer-events-none" />

      {/* Ambient Liquid Glow Orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 ambient-liquid-glow-1 rounded-full opacity-50" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 ambient-liquid-glow-2 rounded-full opacity-40" />

      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-white/10 backdrop-blur-2xl shrink-0 bg-white/[0.03]">
        <div className="liquid-specular-top" />
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md shadow-red-500/30 border-t border-white/30">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-black tracking-tight text-white">Vibe<span className="text-red-500">Flow</span></span>
        </div>

        {/* Single Close Button */}
        <button
          onClick={() => setIsNowPlayingOpen(false)}
          id="close-split-player-btn"
          className="liquid-btn group flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-red-500 text-zinc-200 hover:text-white border border-white/20 backdrop-blur-md transition-all duration-200 shadow-md active:scale-95"
          title="Close Split Screen"
        >
          <span className="text-xs font-semibold tracking-wide">Close</span>
          <X className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90 text-zinc-200 group-hover:text-white" />
        </button>
      </header>

      {/* Main Layout: Desktop Split-Screen (60% / 40%) | Mobile Full-Player + Slide-Up Suggestions */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* ========================================================= */}
        {/* PLAYER SECTION — Full Screen on Mobile | 60% on Desktop   */}
        {/* ========================================================= */}
        <section
          onTouchStart={handlePlayerTouchStart}
          onTouchEnd={handlePlayerTouchEnd}
          className="w-full lg:w-[60%] flex-1 flex flex-col justify-between px-5 sm:px-12 py-3 sm:py-6 overflow-hidden lg:border-r border-white/10 lg:shadow-2xl min-h-0 relative select-none"
        >
          <div className="flex-1 flex flex-col items-center justify-between max-w-xl mx-auto w-full my-auto h-full">
            {/* Album Artwork Container with YouTube Ambient Light Mode */}
            <div className="relative group my-auto flex items-center justify-center w-full max-w-sm sm:max-w-md mx-auto mb-2 sm:mb-4">
              {/* 1. Primary YouTube-Style Ambient Glow Bleed (Directly matches artwork color spectrum) */}
              <div
                aria-hidden="true"
                className="absolute -inset-4 sm:-inset-6 rounded-[2.5rem] filter blur-2xl sm:blur-3xl opacity-80 dark:opacity-90 scale-110 sm:scale-115 transition-all duration-700 pointer-events-none"
                style={{
                  backgroundImage: `url(${artwork})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />

              {/* 2. Secondary Diffuse Atmospheric Ambient Light Aura */}
              <div
                aria-hidden="true"
                className="absolute -inset-8 sm:-inset-12 rounded-full filter blur-[45px] sm:blur-[65px] opacity-45 dark:opacity-55 scale-125 transition-all duration-700 pointer-events-none"
                style={{
                  backgroundImage: `url(${artwork})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />

              {/* 3. Soft Ambient Saturation Glow Halo */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full filter blur-2xl opacity-25 bg-radial from-red-500/40 via-rose-500/20 to-transparent pointer-events-none"
              />

              {/* 4. Crisp Foreground Album Artwork Card */}
              <div className="relative aspect-square w-44 sm:w-64 md:w-72 lg:w-80 max-h-[26vh] sm:max-h-[34vh] rounded-3xl overflow-hidden shadow-2xl border border-white/25 z-10 transition-transform duration-300 group-hover:scale-[1.02]">
                <img
                  src={artwork}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
                {/* Specular top light edge reflection */}
                <div className="liquid-specular-top" />

                {currentTrack.source === 'jamendo' && (
                  <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30 shadow-md">
                    Jamendo
                  </span>
                )}
                {currentTrack.source === 'youtube' && (
                  <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-red-600/90 backdrop-blur-md text-white border border-red-500/40 shadow-md">
                    YouTube
                  </span>
                )}
              </div>
            </div>

            {/* Track Title, Artist & Like Action */}
            <div className="w-full flex items-center justify-between mb-1.5 sm:mb-3">
              <div className="flex flex-col min-w-0 pr-3">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight truncate text-white">
                  {cleanSongTitle(currentTrack.title)}
                </h1>
                <p className="text-xs sm:text-base text-zinc-400 font-medium truncate mt-0.5 sm:mt-1">
                  {cleanArtistName(currentTrack.artist?.name || '', currentTrack.title)}
                </p>
              </div>

              <button
                onClick={toggleLikeCurrentTrack}
                className={`liquid-btn p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur-md transition-all shrink-0 shadow-sm ${
                  currentTrack.isLiked ? 'text-red-500 bg-red-500/15 border-red-500/30' : 'text-zinc-400 hover:text-white'
                }`}
                title={currentTrack.isLiked ? 'Unlike' : 'Like'}
              >
                <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${currentTrack.isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Interactive Progress Bar */}
            <div className="w-full flex flex-col gap-1 my-1">
              <div className="relative group flex items-center h-4 cursor-pointer">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer appearance-none"
                  style={{
                    background: `linear-gradient(to right, #ef4444 ${progressPercent}%, rgba(255,255,255,0.15) ${progressPercent}%)`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-zinc-400 font-medium tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="w-full flex items-center justify-between mt-2 sm:mt-4 px-1 sm:px-6">
              <button
                onClick={toggleShuffle}
                className={`liquid-btn p-2 sm:p-2.5 rounded-full transition-all relative ${
                  shuffle ? 'text-red-500 bg-red-500/15 border border-red-500/20' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5 sm:w-6 sm:h-6" />
                {shuffle && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                )}
              </button>

              <button
                onClick={prevTrack}
                className="liquid-btn p-2.5 sm:p-3 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-all"
                title="Previous"
              >
                <SkipBack className="w-5 h-5 sm:w-7 sm:h-7 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                className="liquid-btn w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white flex items-center justify-center shadow-2xl shadow-red-500/40 border-t border-white/40 transition-all"
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
                className="liquid-btn p-2.5 sm:p-3 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-all"
                title="Next"
              >
                <SkipForward className="w-5 h-5 sm:w-7 sm:h-7 fill-current" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`liquid-btn p-2 sm:p-2.5 rounded-full transition-all relative ${
                  repeat !== 'off' ? 'text-red-500 bg-red-500/15 border border-red-500/20' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
                title={`Repeat: ${repeat}`}
              >
                {repeat === 'one' ? (
                  <Repeat1 className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Repeat className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
                {repeat !== 'off' && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                )}
              </button>
            </div>

            {/* Volume Control Bar */}
            <div className="w-full flex items-center justify-center gap-2.5 mt-2 sm:mt-5 px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 max-w-xs shadow-lg relative overflow-hidden">
              <div className="liquid-specular-top" />
              <button onClick={toggleMute} className="liquid-btn text-zinc-400 hover:text-white transition-colors">
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
                className="w-36 sm:w-48 h-1.5 bg-white/20 rounded-full cursor-pointer appearance-none"
                style={{
                  background: `linear-gradient(to right, #ef4444 ${volumePercent}%, rgba(255,255,255,0.15) ${volumePercent}%)`,
                }}
              />
            </div>

            {/* Mobile Slide-Up Bar for Suggestions & Queue */}
            <div className="lg:hidden w-full pt-2 flex flex-col items-center">
              <button
                onClick={() => setIsMobileSheetOpen(true)}
                className="liquid-btn group flex flex-col items-center gap-1 px-5 py-2 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 border border-white/10 backdrop-blur-xl shadow-lg transition-all"
                title="Slide up for suggestions"
              >
                <div className="w-10 h-1 bg-white/40 group-hover:bg-red-500 rounded-full transition-colors" />
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 group-hover:text-white">
                  <Sparkles className="w-3.5 h-3.5 text-red-500" />
                  <span>Slide up for Suggestions & Queue</span>
                  <ChevronUp className="w-4 h-4 text-zinc-400 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* RIGHT PANEL — 40% WIDTH: MUSIC BROWSING SECTION (DESKTOP)  */}
        {/* ========================================================= */}
        <aside className="hidden lg:flex lg:w-[40%] flex-col bg-black/35 backdrop-blur-3xl overflow-hidden min-h-0 relative">
          <div className="liquid-specular-top" />
          {browsingContent}
        </aside>
      </div>

      {/* ========================================================= */}
      {/* MOBILE SLIDE-UP SUGGESTIONS & QUEUE SHEET (DRAWER)        */}
      {/* ========================================================= */}
      {/* Mobile Backdrop */}
      {isMobileSheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileSheetOpen(false)}
        />
      )}

      {/* Mobile Slide-Up Drawer Panel */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col h-[82vh] bg-[#0c0e17]/95 backdrop-blur-3xl rounded-t-[2.5rem] border-t border-white/15 shadow-[0_-25px_60px_rgba(0,0,0,0.9)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isMobileSheetOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
        style={{
          transform: isMobileSheetOpen
            ? `translate3d(0, ${Math.max(0, touchDeltaY)}px, 0)`
            : 'translate3d(0, 100%, 0)',
        }}
      >
        <div className="liquid-specular-top" />

        {/* Mobile Sheet Drag Handle Bar */}
        <div
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
          onClick={() => setIsMobileSheetOpen(false)}
          className="w-full flex flex-col items-center pt-3 pb-2 cursor-pointer select-none border-b border-white/10 shrink-0"
        >
          <div className="w-12 h-1.5 bg-white/35 rounded-full mb-2" />
          <div className="flex items-center justify-between w-full px-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold text-white">Suggestions & Queue</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileSheetOpen(false);
              }}
              className="liquid-btn p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300"
              title="Close drawer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sheet Scrollable Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {browsingContent}
        </div>
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
              {cleanSongTitle(track.title)}
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 truncate mt-0.5">
            {cleanArtistName(track.artist?.name || '', track.title)}
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
