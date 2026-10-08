import React from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { formatTime } from '../../utils/format';

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
    isQueueOpen,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    setIsNowPlayingOpen,
    setIsQueueOpen,
    toggleLikeCurrentTrack,
  } = usePlayerStore();

  if (!isNowPlayingOpen || !currentTrack) return null;

  const artwork = currentTrack.artworkUrl || currentTrack.coverUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(currentTrack.title)}`;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-zinc-950 text-white animate-slide-up select-none">
      {/* Blurred Album Artwork Background */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 scale-125 transition-all duration-700 pointer-events-none"
        style={{ backgroundImage: `url(${artwork})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-zinc-950 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2">
        <button
          onClick={() => setIsNowPlayingOpen(false)}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          title="Minimize player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Playing from
          </span>
          <span className="text-xs font-semibold text-zinc-200">
            {currentTrack.album?.title || 'VibeFlow Music'}
          </span>
        </div>

        <button
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
            isQueueOpen ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-zinc-300'
          }`}
          title="Queue"
        >
          <ListMusic className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full py-4">
        {/* Large Album Artwork */}
        <div className="relative aspect-square w-full max-w-[340px] sm:max-w-[380px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
          <img
            src={artwork}
            alt={currentTrack.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {currentTrack.source === 'jamendo' && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30">
              Jamendo Catalog
            </span>
          )}
        </div>

        {/* Track Title, Artist, & Favorite Button */}
        <div className="w-full flex items-center justify-between mt-8 mb-4">
          <div className="flex flex-col min-w-0 pr-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
              {currentTrack.title}
            </h1>
            <p className="text-base text-zinc-400 font-medium truncate mt-1">
              {currentTrack.artist?.name || 'Unknown Artist'}
            </p>
          </div>

          <button
            onClick={toggleLikeCurrentTrack}
            className={`p-3 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all ${
              currentTrack.isLiked ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:text-white'
            }`}
            title={currentTrack.isLiked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-6 h-6 ${currentTrack.isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Interactive Progress Slider */}
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
        <div className="w-full flex items-center justify-between mt-6 px-2">
          <button
            onClick={toggleShuffle}
            className={`p-2 transition-colors relative ${
              shuffle ? 'text-red-500' : 'text-zinc-400 hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-6 h-6" />
            {shuffle && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full" />}
          </button>

          <button
            onClick={prevTrack}
            className="p-3 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all"
            title="Previous"
          >
            <SkipBack className="w-8 h-8 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current text-white" />
            ) : (
              <Play className="w-7 h-7 fill-current text-white ml-1" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-3 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all"
            title="Next"
          >
            <SkipForward className="w-8 h-8 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-2 transition-colors relative ${
              repeat !== 'off' ? 'text-red-500' : 'text-zinc-400 hover:text-white'
            }`}
            title={`Repeat: ${repeat}`}
          >
            {repeat === 'one' ? <Repeat1 className="w-6 h-6" /> : <Repeat className="w-6 h-6" />}
            {repeat !== 'off' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Volume Control Bar */}
        <div className="w-full flex items-center justify-center gap-3 mt-6 px-4 py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5">
          <button onClick={toggleMute} className="text-zinc-400 hover:text-white">
            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-48 h-1.5 bg-white/20 rounded-full cursor-pointer appearance-none"
            style={{
              background: `linear-gradient(to right, #ef4444 ${volumePercent}%, rgba(255,255,255,0.2) ${volumePercent}%)`,
            }}
          />
        </div>
      </main>

      <footer className="relative z-10 pb-6 text-center text-[11px] text-zinc-500">
        VibeFlow High Fidelity Audio Platform
      </footer>
    </div>
  );
};
