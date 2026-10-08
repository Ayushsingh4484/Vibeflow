import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Heart, MoreHorizontal, Plus, ListPlus, Trash2, ExternalLink } from 'lucide-react';
import { Track } from '../../types';
import { formatTime } from '../../utils/format';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { trackService } from '../../services/trackService';

interface TrackRowProps {
  track: Track;
  index: number;
  playlistId?: string;
  onRemoveFromPlaylist?: (trackId: string) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  allTracks?: Track[];
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  playlistId,
  onRemoveFromPlaylist,
  onOpenAddToPlaylist,
  allTracks,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue, playNext } = usePlayerStore();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();

  const [isLiked, setIsLiked] = useState<boolean>(!!track.isLiked);
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const isCurrent = currentTrack?.id === track.id;
  const isJamendo = track.source === 'jamendo' || track.id.startsWith('jamendo-');

  const handlePlayClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, allTracks);
    }
  };

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      addToast('Please log in to save songs to your library', 'info');
      return;
    }

    const nextState = !isLiked;
    setIsLiked(nextState);

    try {
      if (nextState) {
        await trackService.likeTrack(track.id, track);
        addToast(`Added "${track.title}" to Liked Songs`, 'success');
      } else {
        await trackService.unlikeTrack(track.id);
        addToast(`Removed "${track.title}" from Liked Songs`, 'info');
      }
    } catch {
      setIsLiked(!nextState);
      addToast('Failed to update liked state', 'error');
    }
  };

  return (
    <div
      onDoubleClick={handlePlayClick}
      className={`group relative flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 rounded-xl transition-all cursor-pointer text-sm ${
        isCurrent
          ? 'bg-red-500/10 text-red-500 font-bold'
          : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      {/* Index & Play Button */}
      <div className="w-6 flex items-center justify-center shrink-0">
        {isCurrent && isPlaying ? (
          <div className="flex items-end gap-0.5 h-4 w-4 group-hover:hidden">
            <span className="w-1 bg-red-500 rounded-full animate-bar-1" />
            <span className="w-1 bg-red-500 rounded-full animate-bar-2" />
            <span className="w-1 bg-red-500 rounded-full animate-bar-3" />
          </div>
        ) : (
          <span className={`text-zinc-400 dark:text-zinc-500 group-hover:hidden ${isCurrent ? 'text-red-500 font-bold' : ''}`}>
            {index + 1}
          </span>
        )}

        <button
          onClick={handlePlayClick}
          className="hidden group-hover:flex items-center justify-center text-slate-900 dark:text-white hover:scale-110 transition-transform"
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-4 h-4 fill-current text-red-500" />
          ) : (
            <Play className="w-4 h-4 fill-current text-slate-900 dark:text-white" />
          )}
        </button>
      </div>

      {/* Artwork & Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {(track.artworkUrl || track.coverUrl) ? (
          <img
            src={(track.artworkUrl || track.coverUrl)!}
            alt={track.title}
            className="w-10 h-10 rounded-lg object-cover shadow-sm bg-zinc-200 dark:bg-zinc-800 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(track.title)}`;
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
            <Play className="w-4 h-4 text-zinc-400" />
          </div>
        )}

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`truncate font-semibold ${isCurrent ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
              {track.title}
            </span>
            {isJamendo && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/20 shrink-0">
                Jamendo
              </span>
            )}
          </div>
          {track.artist && (
            <Link
              to={`/artist/${track.artist.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:underline truncate"
            >
              {track.artist.name}
            </Link>
          )}
        </div>
      </div>

      {/* Album Title (Desktop Only) */}
      <div className="hidden md:block w-1/4 truncate text-xs text-zinc-500 dark:text-zinc-400">
        {track.album?.title || 'Single'}
      </div>

      {/* Like Button */}
      <button
        onClick={handleLikeToggle}
        className={`p-1.5 transition-all ${
          isLiked
            ? 'text-red-500'
            : 'text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-slate-900 dark:hover:text-white'
        }`}
        title={isLiked ? 'Unlike' : 'Like'}
      >
        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
      </button>

      {/* Duration */}
      <div className="text-xs text-zinc-400 tabular-nums w-10 text-right shrink-0">
        {formatTime(track.duration || 0)}
      </div>

      {/* More Options Dropdown */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-slate-900 dark:hover:text-white transition-opacity"
          title="More options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-8 z-50 w-48 bg-white dark:bg-[#1f2029] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl py-1 text-xs text-slate-700 dark:text-zinc-200 animate-slide-up">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToQueue(track);
                  setShowMenu(false);
                  addToast('Added to queue', 'success');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <Plus className="w-4 h-4 text-zinc-400" />
                Add to queue
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playNext(track);
                  setShowMenu(false);
                  addToast('Will play next', 'success');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <ListPlus className="w-4 h-4 text-zinc-400" />
                Play next
              </button>

              {onOpenAddToPlaylist && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAddToPlaylist(track);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-4 h-4 text-zinc-400" />
                  Add to playlist
                </button>
              )}

              {playlistId && onRemoveFromPlaylist && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromPlaylist(track.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-500 hover:bg-rose-500/10 transition-colors border-t border-black/5 dark:border-white/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove from playlist
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
