import React, { useState, useEffect } from 'react';
import { trackService } from '../services/trackService';
import { Track } from '../types';
import { TrackTable } from '../components/common/TrackTable';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatDuration } from '../utils/format';
import { Heart, Play, Shuffle } from 'lucide-react';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';

export const LikedSongsPage: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  const { playQueue, toggleShuffle } = usePlayerStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      trackService
        .getLikedTracks()
        .then((res) => setTracks(res.tracks))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  const handlePlayAll = (shuffle: boolean = false) => {
    if (tracks.length === 0) return;
    if (shuffle) toggleShuffle();
    playQueue(tracks, 0);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-6 p-6 bg-gradient-to-b from-indigo-800 via-indigo-950/60 to-transparent">
        {/* Cover Icon */}
        <div className="w-44 h-44 md:w-52 md:h-52 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-500 shadow-2xl flex items-center justify-center shrink-0">
          <Heart className="w-24 h-24 text-white fill-current animate-pulse" />
        </div>

        {/* Metadata */}
        <div className="flex flex-col gap-2 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
            Playlist
          </span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
            Liked Songs
          </h1>
          <div className="flex items-center gap-2 text-xs md:text-sm text-zinc-300 font-medium mt-2">
            <span className="font-bold text-white">{user?.name || 'You'}</span>
            <span>•</span>
            <span>{tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</span>
            {totalDuration > 0 && (
              <>
                <span>•</span>
                <span className="text-zinc-400">{formatDuration(totalDuration)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls & Track Table */}
      <div className="px-6 flex flex-col gap-6">
        {tracks.length > 0 && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => handlePlayAll(false)}
              className="w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-400 text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
              title="Play Liked Songs"
            >
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </button>
            <button
              onClick={() => handlePlayAll(true)}
              className="p-3 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="Shuffle Liked Songs"
            >
              <Shuffle className="w-6 h-6" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-zinc-500">Loading your liked songs...</div>
        ) : tracks.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 flex flex-col items-center gap-3">
            <Heart className="w-12 h-12 text-zinc-700" />
            <h3 className="text-lg font-bold text-white">Songs you like will appear here</h3>
            <p className="text-sm text-zinc-400">Save songs by tapping the heart icon as you listen.</p>
          </div>
        ) : (
          <TrackTable
            tracks={tracks}
            onOpenAddToPlaylist={(t) => setSelectedTrackForPlaylist(t)}
          />
        )}
      </div>

      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
