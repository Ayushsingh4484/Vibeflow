import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { X, Play, Trash2, ListMusic } from 'lucide-react';
import { formatTime } from '../../utils/format';

export const QueueDrawer: React.FC = () => {
  const {
    isQueueOpen,
    setIsQueueOpen,
    currentTrack,
    queue,
    queueIndex,
    playTrack,
    removeFromQueue,
    clearQueue,
  } = usePlayerStore();

  if (!isQueueOpen) return null;

  const nextTracks = queue.slice(queueIndex + 1);

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white/85 dark:bg-[#10121b]/85 backdrop-blur-3xl border-l border-black/10 dark:border-white/10 shadow-2xl flex flex-col pt-16 pb-24 animate-slide-up relative overflow-hidden">
      {/* Specular top light edge */}
      <div className="liquid-specular-top" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Play Queue</h2>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 1 && (
            <button
              onClick={clearQueue}
              className="liquid-btn text-xs text-zinc-600 dark:text-zinc-400 hover:text-red-500 px-3 py-1 rounded-full border border-black/10 dark:border-white/10 hover:bg-red-500/10 transition-all font-semibold"
            >
              Clear Queue
            </button>
          )}
          <button
            onClick={() => setIsQueueOpen(false)}
            className="liquid-btn p-1.5 rounded-full text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Queue Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
        {/* Now Playing */}
        {currentTrack && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Now Playing
            </h3>
            <div className="liquid-glass-card flex items-center gap-3 p-3 rounded-2xl border-red-500/30">
              {(currentTrack.artworkUrl || currentTrack.coverUrl) && (
                <img
                  src={(currentTrack.artworkUrl || currentTrack.coverUrl)!}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded-xl object-cover bg-zinc-800 border border-white/20 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(currentTrack.title)}`;
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-red-500 truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {currentTrack.artist?.name || 'Artist'}
                </p>
              </div>
              <span className="text-xs text-zinc-400 tabular-nums font-medium">
                {formatTime(currentTrack.duration)}
              </span>
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Next In Queue ({nextTracks.length})
            </h3>
          </div>

          {nextTracks.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-sm">
              No tracks in queue. Add songs from albums or search!
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {nextTracks.map((track, i) => {
                const actualIndex = queueIndex + 1 + i;
                return (
                  <div
                    key={`${track.id}-${actualIndex}`}
                    className="liquid-btn group flex items-center gap-3 p-2 rounded-xl hover:bg-white/60 dark:hover:bg-white/8 transition-colors"
                  >
                    {(track.artworkUrl || track.coverUrl) && (
                      <img
                        src={(track.artworkUrl || track.coverUrl)!}
                        alt={track.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 bg-zinc-800 border border-white/10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(track.title)}`;
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white truncate group-hover:text-red-500 transition-colors">
                        {track.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {track.artist?.name || 'Artist'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => playTrack(track, queue)}
                        className="p-1.5 text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white/40 dark:hover:bg-white/10"
                        title="Play now"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        onClick={() => removeFromQueue(actualIndex)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-full hover:bg-white/40 dark:hover:bg-white/10"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
