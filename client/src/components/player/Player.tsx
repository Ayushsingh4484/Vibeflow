import React from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  ListMusic,
  Heart,
  Music,
  Maximize2,
} from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { formatTime } from '../../utils/format';

export const Player: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    isQueueOpen,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    setIsQueueOpen,
    setIsNowPlayingOpen,
    toggleLikeCurrentTrack,
  } = usePlayerStore();

  if (!currentTrack) {
    return (
      <div className="fixed bottom-20 md:bottom-4 inset-x-3 md:inset-x-auto md:right-6 md:w-96 glass-panel rounded-2xl z-30 p-3 shadow-2xl flex items-center justify-between gap-3 text-xs opacity-95 transition-all select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 dark:bg-zinc-800 flex items-center justify-center shrink-0">
            <Music className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="flex flex-col">
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">No track selected</p>
            <p className="text-[11px] text-zinc-500">Pick a song or playlist to listen</p>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;
  const artwork =
    currentTrack.artworkUrl ||
    currentTrack.coverUrl ||
    `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(currentTrack.title)}`;

  return (
    <div className="fixed bottom-20 md:bottom-4 inset-x-3 md:inset-x-6 z-30 flex flex-col transition-all select-none">
      {/* Floating Capsule Mini Player */}
      <div className="relative group bg-white/95 dark:bg-[#16171e]/95 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-2xl md:rounded-3xl shadow-2xl p-2.5 md:p-3.5 flex items-center justify-between gap-2 md:gap-6 overflow-hidden">
        {/* Scrubber indicator top border line */}
        <div
          className="absolute top-0 left-0 h-[2.5px] bg-red-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Left: Artwork & Track Title (Tapping opens Full Player) */}
        <div
          onClick={() => setIsNowPlayingOpen(true)}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group/track hover:opacity-90 transition-opacity"
        >
          <div className="relative aspect-square w-11 h-11 md:w-12 md:h-12 rounded-xl md:rounded-2xl overflow-hidden shadow-md bg-zinc-800 shrink-0">
            <img
              src={artwork}
              alt={currentTrack.title}
              className="w-full h-full object-cover group-hover/track:scale-105 transition-transform"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-0.5">
                <span className="w-1 bg-red-500 rounded-full animate-bar-1" />
                <span className="w-1 bg-red-500 rounded-full animate-bar-2" />
                <span className="w-1 bg-red-500 rounded-full animate-bar-3" />
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate">
                {currentTrack.title}
              </span>
              <Maximize2 className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover/track:opacity-100 transition-opacity shrink-0" />
            </div>
            {currentTrack.artist && (
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                {currentTrack.artist.name}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLikeCurrentTrack();
            }}
            className={`p-1.5 ml-1 transition-colors hidden sm:block ${
              currentTrack.isLiked ? 'text-red-500' : 'text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={currentTrack.isLiked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-4 h-4 ${currentTrack.isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center Controls (Mobile & Desktop) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded-full transition-colors hidden sm:block ${
              shuffle ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={prevTrack}
            className="p-1.5 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:scale-110 active:scale-95 transition-all"
            title="Previous"
          >
            <SkipBack className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/25 hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current text-white" />
            ) : (
              <Play className="w-4 h-4 md:w-5 md:h-5 fill-current text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-1.5 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:scale-110 active:scale-95 transition-all"
            title="Next"
          >
            <SkipForward className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-1.5 rounded-full transition-colors hidden sm:block ${
              repeat !== 'off' ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={`Repeat: ${repeat}`}
          >
            {repeat === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>

        {/* Right Controls: Desktop Progress & Queue / Volume */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-400 tabular-nums w-48">
            <span className="w-8 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full cursor-pointer appearance-none"
              style={{
                background: `linear-gradient(to right, #ef4444 ${progressPercent}%, rgba(150,150,150,0.3) ${progressPercent}%)`,
              }}
            />
            <span className="w-8">{formatTime(duration)}</span>
          </div>

          <button
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            className={`p-2 rounded-full transition-colors ${
              isQueueOpen ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 group w-24">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-slate-900 dark:hover:text-white">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full cursor-pointer appearance-none"
              style={{
                background: `linear-gradient(to right, #ef4444 ${volumePercent}%, rgba(150,150,150,0.3) ${volumePercent}%)`,
              }}
            />
          </div>
        </div>

        {/* Mobile Queue Icon Button */}
        <button
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          className="p-1.5 text-zinc-400 hover:text-slate-900 dark:hover:text-white lg:hidden"
          title="Queue"
        >
          <ListMusic className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
