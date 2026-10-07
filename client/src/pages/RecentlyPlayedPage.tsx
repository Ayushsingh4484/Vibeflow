import React, { useState, useEffect } from 'react';
import { trackService } from '../services/trackService';
import { Track } from '../types';
import { TrackTable } from '../components/common/TrackTable';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { Clock, Play, Shuffle } from 'lucide-react';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';

export const RecentlyPlayedPage: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  const { playQueue, toggleShuffle } = usePlayerStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      trackService
        .getRecentlyPlayed()
        .then((res) => setTracks(res.tracks))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-brand-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Recently Played</h1>
            <p className="text-xs text-zinc-400">Your listening history across all devices</p>
          </div>
        </div>

        {tracks.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => playQueue(tracks, 0)}
              className="px-5 py-2 rounded-full bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> Play History
            </button>
            <button
              onClick={() => {
                toggleShuffle();
                playQueue(tracks, 0);
              }}
              className="p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-500">Loading listening history...</div>
      ) : tracks.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 flex flex-col items-center gap-3">
          <Clock className="w-12 h-12 text-zinc-700" />
          <h3 className="text-lg font-bold text-white">No recently played tracks</h3>
          <p className="text-sm text-zinc-400">Tracks you listen to will show up here.</p>
        </div>
      ) : (
        <TrackTable
          tracks={tracks}
          onOpenAddToPlaylist={(t) => setSelectedTrackForPlaylist(t)}
        />
      )}

      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
