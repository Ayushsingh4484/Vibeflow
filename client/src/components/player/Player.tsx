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
    toggleLikeCurrentTrack,
  } = usePlayerStore();

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 inset-x-0 h-20 bg-[#181818] border-t border-white/10 z-30 flex items-center justify-between px-6 select-none">
        <div className="flex items-center gap-3 text-zinc-500 text-sm">
          <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center border border-white/5">
            <Music className="w-6 h-6 text-zinc-600" />
          </div>
          <div>
            <p className="font-medium text-zinc-400">No track selected</p>
            <p className="text-xs">Choose a song or playlist to start playing</p>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  return (
    <div className="fixed bottom-0 inset-x-0 h-20 md:h-24 bg-[#121212]/95 backdrop-blur-2xl border-t border-white/10 z-30 flex items-center justify-between px-3 md:px-6 select-none shadow-2xl">
      {/* Left: Track Details & Like */}
      <div className="flex items-center gap-3 w-1/4 min-w-[140px] md:min-w-[180px]">
        {(currentTrack.artworkUrl || currentTrack.coverUrl) ? (
          <img
            src={(currentTrack.artworkUrl || currentTrack.coverUrl)!}
            alt={currentTrack.title}
            className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover shadow-md bg-zinc-800 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(currentTrack.title)}`;
            }}
          />
        ) : (
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
            <Music className="w-6 h-6 text-zinc-400" />
          </div>
        )}

        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-white truncate hover:underline cursor-pointer">
            {currentTrack.title}
          </span>
          {currentTrack.artist && (
            <Link
              to={`/artist/${currentTrack.artist.id}`}
              className="text-xs text-zinc-400 hover:text-white hover:underline truncate"
            >
              {currentTrack.artist.name}
            </Link>
          )}
        </div>

        <button
          onClick={toggleLikeCurrentTrack}
          className={`p-1.5 ml-1 transition-colors hidden sm:block ${
            currentTrack.isLiked ? 'text-brand-500' : 'text-zinc-400 hover:text-white'
          }`}
          title={currentTrack.isLiked ? 'Unlike' : 'Like'}
        >
          <Heart className={`w-5 h-5 ${currentTrack.isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Center: Controls & Scrubber */}
      <div className="flex flex-col items-center gap-1.5 w-full max-w-xl px-2">
        {/* Playback Buttons */}
        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={toggleShuffle}
            className={`p-1 transition-colors relative ${
              shuffle ? 'text-brand-500' : 'text-zinc-400 hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
            {shuffle && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />}
          </button>

          <button
            onClick={prevTrack}
            className="p-1 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white hover:bg-brand-400 text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current text-black" />
            ) : (
              <Play className="w-4 h-4 md:w-5 md:h-5 fill-current text-black ml-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-1 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all"
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-1 transition-colors relative ${
              repeat !== 'off' ? 'text-brand-500' : 'text-zinc-400 hover:text-white'
            }`}
            title={`Repeat: ${repeat}`}
          >
            {repeat === 'one' ? (
              <Repeat1 className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <Repeat className="w-4 h-4 md:w-5 md:h-5" />
            )}
            {repeat !== 'off' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Progress Slider */}
        <div className="w-full flex items-center gap-2.5 text-xs text-zinc-400 tabular-nums">
          <span className="w-9 text-right">{formatTime(currentTime)}</span>
          <div className="relative flex-1 group flex items-center h-4">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-full cursor-pointer appearance-none"
              style={{
                background: `linear-gradient(to right, #1db954 ${progressPercent}%, #4d4d4d ${progressPercent}%)`,
              }}
            />
          </div>
          <span className="w-9">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Queue & Volume */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[120px]">
        <button
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          className={`p-2 rounded-full transition-colors ${
            isQueueOpen ? 'text-brand-400 bg-white/10' : 'text-zinc-400 hover:text-white'
          }`}
          title="Play Queue"
        >
          <ListMusic className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 group w-28 md:w-32">
          <button
            onClick={toggleMute}
            className="text-zinc-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-zinc-700 rounded-full cursor-pointer appearance-none"
            style={{
              background: `linear-gradient(to right, #1db954 ${volumePercent}%, #4d4d4d ${volumePercent}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
