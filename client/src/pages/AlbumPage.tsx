import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { albumService } from '../services/albumService';
import { Album, Track } from '../types';
import { TrackTable } from '../components/common/TrackTable';
import { usePlayerStore } from '../store/usePlayerStore';
import { formatDuration, formatDate } from '../utils/format';
import { Play, Shuffle, Disc } from 'lucide-react';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';

export const AlbumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playQueue, toggleShuffle } = usePlayerStore();

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    albumService
      .getAlbumById(id)
      .then((res) => setAlbum(res.album))
      .catch((err) => console.error('Fetch album error:', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="py-20 text-center text-zinc-500">Loading album...</div>;
  }

  if (!album) {
    return (
      <div className="py-20 text-center text-zinc-500">
        <h2 className="text-xl font-bold text-white mb-2">Album not found</h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 rounded-full bg-white text-black font-semibold text-sm"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const tracks = album.tracks || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-6 p-6 bg-gradient-to-b from-zinc-800 via-zinc-900/60 to-transparent">
        {album.coverUrl ? (
          <img
            src={album.coverUrl}
            alt={album.title}
            className="w-44 h-44 md:w-52 md:h-52 rounded-2xl object-cover shadow-2xl shrink-0 bg-zinc-800"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(album.title)}`;
            }}
          />
        ) : (
          <div className="w-44 h-44 md:w-52 md:h-52 rounded-2xl bg-zinc-800 shadow-2xl flex items-center justify-center shrink-0">
            <Disc className="w-20 h-20 text-zinc-500" />
          </div>
        )}

        <div className="flex flex-col gap-2 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Album</span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight truncate">
            {album.title}
          </h1>

          <div className="flex items-center gap-2 text-xs md:text-sm text-zinc-300 font-medium mt-2">
            {album.artist && (
              <Link
                to={`/artist/${album.artist.id}`}
                className="font-bold text-white hover:underline hover:text-brand-400 transition-colors"
              >
                {album.artist.name}
              </Link>
            )}
            {album.releaseDate && (
              <>
                <span>•</span>
                <span>{album.releaseDate.slice(0, 4)}</span>
              </>
            )}
            <span>•</span>
            <span>{tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</span>
            {album.totalDuration ? (
              <>
                <span>•</span>
                <span className="text-zinc-400">{formatDuration(album.totalDuration)}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Actions & Track Table */}
      <div className="px-6 flex flex-col gap-6">
        {tracks.length > 0 && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => playQueue(tracks, 0)}
              className="w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-400 text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
              title="Play Album"
            >
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </button>
            <button
              onClick={() => {
                toggleShuffle();
                playQueue(tracks, 0);
              }}
              className="p-3 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="Shuffle Album"
            >
              <Shuffle className="w-6 h-6" />
            </button>
          </div>
        )}

        <TrackTable
          tracks={tracks}
          onOpenAddToPlaylist={(t) => setSelectedTrackForPlaylist(t)}
        />
      </div>

      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
