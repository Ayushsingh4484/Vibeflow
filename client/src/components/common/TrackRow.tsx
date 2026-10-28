import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Heart, MoreHorizontal, Plus, ListPlus, Trash2, ExternalLink } from 'lucide-react';
import { Track } from '../../types';
import { formatTime, cleanSongTitle, cleanArtistName } from '../../utils/format';
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
  const isYouTube = track.source === 'youtube' || track.id.startsWith('yt-');

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
      className={`liquid-btn group relative flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 rounded-2xl transition-all cursor-pointer text-sm ${
        isCurrent
          ? 'bg-red-500/15 text-red-500 font-bold border border-red-500/25 shadow-sm backdrop-blur-md'
          : 'hover:bg-white/60 dark:hover:bg-white/8 backdrop-blur-sm border border-transparent hover:border-black/5 dark:hover:border-white/5 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      {/* Index & Play Button */}
      <div className="w-6 flex items-center justify-center shrink-0">
        {isCurrent && isPlaying ? (
          <div className="flex items-end gap-0.5 h-4 w-4 group-hover:hidden">
            <span className="w-1 bg-red-500 rounded-full animate-bar-1 shadow-[0_0_4px_rgba(239,68,68,0.7)]" />
            <span className="w-1 bg-red-500 rounded-full animate-bar-2 shadow-[0_0_4px_rgba(239,68,68,0.7)]" />
            <span className="w-1 bg-red-500 rounded-full animate-bar-3 shadow-[0_0_4px_rgba(239,68,68,0.7)]" />
          </div>
        ) : (
          <span className={`text-zinc-400 dark:text-zinc-500 group-hover:hidden ${isCurrent ? 'text-red-500 font-bold' : ''}`}>
            {index + 1}
          </span>
        )}

        <button
          onClick={handlePlayClick}
          className="liquid-btn hidden group-hover:flex items-center justify-center text-slate-900 dark:text-white"
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
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-xl object-cover shadow-sm bg-zinc-200 dark:bg-zinc-800 border border-white/20 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(track.title)}`;
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-white/10">
            <Play className="w-4 h-4 text-zinc-400" />
          </div>
        )}

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`truncate font-semibold ${isCurrent ? 'text-red-500 font-bold' : 'text-slate-900 dark:text-white'}`}>
              {cleanSongTitle(track.title)}
            </span>
            {isJamendo && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 font-extrabold border border-amber-500/30 backdrop-blur-sm shrink-0">
                Jamendo
              </span>
            )}
            {isYouTube && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-600/20 text-red-600 dark:text-red-400 font-extrabold border border-red-500/40 backdrop-blur-sm shrink-0">
                YouTube
              </span>
            )}
          </div>
          {track.artist && (
            <Link
              to={`/artist/${track.artist.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors truncate font-medium"
            >
              {cleanArtistName(track.artist.name, track.title)}
            </Link>
          )}
        </div>
      </div>

      {/* Album Title (Desktop Only) */}
      <div className="hidden md:block w-1/4 truncate text-xs text-zinc-500 dark:text-zinc-400 font-medium">
        {track.album?.title || 'Single'}
      </div>

      {/* Like Button */}
      <button
        onClick={handleLikeToggle}
        className={`liquid-btn p-1.5 transition-all ${
          isLiked
            ? 'text-red-500'
            : 'text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-slate-900 dark:hover:text-white'
        }`}
        title={isLiked ? 'Unlike' : 'Like'}
      >
        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
      </button>

      {/* Duration */}
      <div className="text-xs text-zinc-400 tabular-nums w-10 text-right shrink-0 font-medium">
        {formatTime(track.duration || 0)}
      </div>

      {/* More Options Dropdown */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="liquid-btn p-1.5 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-slate-900 dark:hover:text-white transition-opacity rounded-full hover:bg-white/40 dark:hover:bg-white/10"
          title="More options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-8 z-50 w-48 bg-white/85 dark:bg-[#181924]/90 backdrop-blur-2xl border border-black/10 dark:border-white/15 rounded-2xl shadow-2xl py-1 text-xs text-slate-700 dark:text-zinc-200 animate-slide-up overflow-hidden">
              <div className="liquid-specular-top" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToQueue(track);
                  setShowMenu(false);
                  addToast('Added to queue', 'success');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-500/10 hover:text-red-500 transition-colors"
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
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-500/10 hover:text-red-500 transition-colors"
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
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-500/10 hover:text-red-500 transition-colors"
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
