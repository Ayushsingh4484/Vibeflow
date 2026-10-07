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
      className={`group relative flex items-center gap-4 px-4 py-2.5 rounded-lg transition-colors cursor-pointer text-sm ${
        isCurrent ? 'bg-white/10 text-brand-400' : 'hover:bg-white/5 text-zinc-300 hover:text-white'
      }`}
    >
      {/* Index & Play Button */}
      <div className="w-6 flex items-center justify-center shrink-0">
        {isCurrent && isPlaying ? (
          <div className="flex items-end gap-0.5 h-4 w-4 group-hover:hidden">
            <span className="w-1 bg-brand-500 rounded-full animate-bar-1" />
            <span className="w-1 bg-brand-500 rounded-full animate-bar-2" />
            <span className="w-1 bg-brand-500 rounded-full animate-bar-3" />
          </div>
        ) : (
          <span className={`text-zinc-500 group-hover:hidden ${isCurrent ? 'text-brand-400 font-bold' : ''}`}>
            {index + 1}
          </span>
        )}

        <button
          onClick={handlePlayClick}
          className="hidden group-hover:flex items-center justify-center text-white hover:scale-110 transition-transform"
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-4 h-4 fill-current text-brand-400" />
          ) : (
            <Play className="w-4 h-4 fill-current text-white" />
          )}
        </button>
      </div>

      {/* Cover & Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {(track.artworkUrl || track.coverUrl) && (
          <img
            src={(track.artworkUrl || track.coverUrl)!}
            alt={track.title}
            className="w-10 h-10 rounded object-cover shrink-0 shadow bg-zinc-800"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(track.title)}`;
            }}
          />
        )}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-medium truncate transition-colors ${
                isCurrent ? 'text-brand-400 font-semibold' : 'text-white'
              }`}
            >
              {track.title}
            </span>
            {isJamendo && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30 shrink-0">
                Jamendo
              </span>
            )}
          </div>
          {track.artist && (
            track.artist.id ? (
              <Link
                to={`/artist/${track.artist.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-zinc-400 hover:text-white hover:underline truncate"
              >
                {track.artist.name}
              </Link>
            ) : (
              <span className="text-xs text-zinc-400 truncate">
                {track.artist.name}
              </span>
            )
          )}
        </div>
      </div>

      {/* Album */}
      {track.album && (
        <div className="hidden md:flex flex-1 min-w-0 items-center">
          {track.album.id ? (
            <Link
              to={`/album/${track.album.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-zinc-400 hover:text-white hover:underline truncate"
            >
              {track.album.title}
            </Link>
          ) : (
            <span className="text-xs text-zinc-400 truncate">
              {track.album.title}
            </span>
          )}
        </div>
      )}

      {/* Like Button */}
      <button
        onClick={handleLikeToggle}
        className={`p-1.5 transition-colors ${
          isLiked
            ? 'text-brand-500'
            : 'text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100'
        }`}
        title={isLiked ? 'Unlike' : 'Like'}
      >
        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
      </button>

      {/* Duration */}
      <div className="text-xs text-zinc-400 w-12 text-right tabular-nums">
        {formatTime(track.duration)}
      </div>

      {/* More Options Dropdown */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 text-zinc-400 hover:text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
            />
            <div className="absolute right-0 top-8 z-50 w-52 bg-[#282828] border border-white/10 rounded-xl shadow-2xl py-1 text-xs text-zinc-200 animate-slide-up">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToQueue(track);
                  addToast(`Added "${track.title}" to queue`, 'success');
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 transition-colors"
              >
                <Plus className="w-4 h-4 text-zinc-400" />
                Add to queue
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playNext(track);
                  addToast(`"${track.title}" will play next`, 'success');
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 transition-colors"
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-4 h-4 text-zinc-400" />
                  Add to playlist...
                </button>
              )}

              {track.externalUrl && (
                <a
                  href={track.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 text-amber-300 hover:text-amber-200 transition-colors border-t border-white/5"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Jamendo
                </a>
              )}

              {playlistId && onRemoveFromPlaylist && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromPlaylist(track.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-white/5"
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
