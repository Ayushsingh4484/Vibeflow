import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Music2 } from 'lucide-react';
import { PrebuiltPlaylist, Playlist } from '../../types';

interface PlaylistCardProps {
  playlist: PrebuiltPlaylist | Playlist;
  onPlay?: (e: React.MouseEvent, playlist: PrebuiltPlaylist | Playlist) => void;
  isPlaying?: boolean;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  onPlay,
  isPlaying = false,
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/playlist/${playlist.id}`);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(e, playlist);
    } else {
      navigate(`/playlist/${playlist.id}`);
    }
  };

  const coverUrl = playlist.coverUrl;
  const gradient = (playlist as any).gradient || 'from-red-600 to-zinc-900';
  const tag = (playlist as any).tag || (playlist as any).category;
  const subtitle = (playlist as any).subtitle || playlist.description;
  const trackCount = (playlist as any).trackCount || ((playlist as any).tracks ? (playlist as any).tracks.length : null);

  return (
    <div
      onClick={handleCardClick}
      className="liquid-glass-card group relative p-3.5 sm:p-4 rounded-3xl cursor-pointer flex flex-col gap-3 select-none shrink-0 overflow-hidden"
    >
      {/* Specular top light edge */}
      <div className="liquid-specular-top opacity-60 group-hover:opacity-100 transition-opacity" />

      {/* Artwork Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-800 shadow-md border border-black/5 dark:border-white/10">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={playlist.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 brightness-95 group-hover:brightness-105"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (coverUrl.startsWith('http') && !img.src.includes('/api/stream/image')) {
                img.src = `/api/stream/image?url=${encodeURIComponent(coverUrl)}`;
              } else {
                img.style.display = 'none';
              }
            }}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient}`}>
            <Music2 className="w-12 h-12 text-white/70" />
          </div>
        )}

        {/* Ambient Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Category / Mood Tag Badge */}
        {tag && (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-black/60 backdrop-blur-md text-white border border-white/15 shadow-sm">
            {tag}
          </div>
        )}

        {/* Track Count Pill */}
        {trackCount && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-tight bg-black/60 backdrop-blur-md text-zinc-300 border border-white/15">
            {trackCount} tracks
          </div>
        )}

        {/* Floating Play Button */}
        <button
          onClick={handlePlayClick}
          title={`Play ${playlist.name}`}
          className="liquid-btn absolute bottom-3 right-3 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white flex items-center justify-center shadow-xl shadow-red-600/40 border-t border-white/40 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-10"
        >
          {isPlaying ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>
      </div>

      {/* Info Container */}
      <div className="flex flex-col gap-1 min-w-0 px-0.5">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate group-hover:text-red-500 transition-colors tracking-tight">
          {playlist.name}
        </h3>
        {subtitle && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 font-medium leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default PlaylistCard;
