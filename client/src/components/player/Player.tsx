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
import { formatTime, cleanSongTitle, cleanArtistName } from '../../utils/format';

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
      <div className="fixed bottom-20 md:bottom-4 inset-x-3 md:inset-x-auto md:right-6 md:w-96 liquid-glass-player rounded-2xl z-30 p-3 shadow-2xl flex items-center justify-between gap-3 text-xs opacity-95 transition-all select-none overflow-hidden">
        <div className="liquid-specular-top" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <Music className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex flex-col">
            <p className="font-bold text-slate-900 dark:text-zinc-100">No track selected</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Pick a song or playlist to listen</p>
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
      {/* Floating Capsule Mini Player with Liquid Glass */}
      <div className="relative group liquid-glass-player rounded-2xl md:rounded-3xl shadow-2xl p-2.5 md:p-3 flex items-center justify-between gap-2 md:gap-6 overflow-hidden">
        {/* Specular top light edge */}
        <div className="liquid-specular-top" />

        {/* Luminous Scrubber indicator top border line */}
        <div
          className="absolute top-0 left-0 h-[2.5px] bg-gradient-to-r from-red-500 via-rose-500 to-amber-400 shadow-[0_0_12px_rgba(239,68,68,0.7)] transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Left: Artwork & Track Title (Tapping opens Full Player) */}
        <div
          onClick={() => setIsNowPlayingOpen(true)}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group/track hover:opacity-95 transition-opacity"
        >
          <div className="relative aspect-square w-11 h-11 md:w-12 md:h-12 rounded-xl md:rounded-2xl overflow-hidden shadow-md bg-zinc-800 border border-white/20 shrink-0">
            <img
              src={artwork}
              alt={currentTrack.title}
              className="w-full h-full object-cover group-hover/track:scale-105 transition-transform duration-300"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center gap-0.5">
                <span className="w-1 bg-red-500 rounded-full animate-bar-1 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                <span className="w-1 bg-red-500 rounded-full animate-bar-2 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                <span className="w-1 bg-red-500 rounded-full animate-bar-3 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate">
                {cleanSongTitle(currentTrack.title)}
              </span>
              <Maximize2 className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover/track:opacity-100 transition-opacity shrink-0" />
            </div>
            {currentTrack.artist && (
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate font-medium">
                {cleanArtistName(currentTrack.artist.name, currentTrack.title)}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLikeCurrentTrack();
            }}
            className={`liquid-btn p-1.5 ml-1 transition-colors hidden sm:block ${
              currentTrack.isLiked ? 'text-red-500' : 'text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={currentTrack.isLiked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-4 h-4 ${currentTrack.isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center Controls (Mobile & Desktop) */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          <button
            onClick={toggleShuffle}
            className={`liquid-btn p-2 rounded-full transition-all hidden sm:block ${
              shuffle ? 'text-red-500 bg-red-500/15 border border-red-500/20 shadow-sm' : 'text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={prevTrack}
            className="liquid-btn p-2 rounded-full text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-all"
            title="Previous"
          >
            <SkipBack className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="liquid-btn w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white flex items-center justify-center shadow-lg shadow-red-500/35 border-t border-white/40 transition-all"
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
            className="liquid-btn p-2 rounded-full text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-all"
            title="Next"
          >
            <SkipForward className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`liquid-btn p-2 rounded-full transition-all hidden sm:block ${
              repeat !== 'off' ? 'text-red-500 bg-red-500/15 border border-red-500/20 shadow-sm' : 'text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10'
            }`}
            title={`Repeat: ${repeat}`}
          >
            {repeat === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>

        {/* Right Controls: Desktop Progress & Queue / Volume */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-400 tabular-nums w-48">
            <span className="w-8 text-right font-medium">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-300 dark:bg-zinc-700/60 rounded-full cursor-pointer appearance-none"
              style={{
                background: `linear-gradient(to right, #ef4444 ${progressPercent}%, rgba(150,150,150,0.25) ${progressPercent}%)`,
              }}
            />
            <span className="w-8 font-medium">{formatTime(duration)}</span>
          </div>

          <button
            onClick={() => setIsNowPlayingOpen(true)}
            className="liquid-btn p-2 rounded-full transition-colors text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10"
            title="Open Split-Screen Player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            className={`liquid-btn p-2 rounded-full transition-all ${
              isQueueOpen ? 'text-red-500 bg-red-500/15 border border-red-500/20 shadow-sm' : 'text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10'
            }`}
            title="Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 group w-24">
            <button onClick={toggleMute} className="liquid-btn text-zinc-400 hover:text-slate-900 dark:hover:text-white">
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
              className="w-full h-1 bg-zinc-300 dark:bg-zinc-700/60 rounded-full cursor-pointer appearance-none"
              style={{
                background: `linear-gradient(to right, #ef4444 ${volumePercent}%, rgba(150,150,150,0.25) ${volumePercent}%)`,
              }}
            />
          </div>
        </div>

        {/* Mobile Queue Icon Button */}
        <button
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          className="liquid-btn p-2 text-zinc-400 hover:text-slate-900 dark:hover:text-white lg:hidden rounded-full hover:bg-white/40 dark:hover:bg-white/10"
          title="Queue"
        >
          <ListMusic className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
