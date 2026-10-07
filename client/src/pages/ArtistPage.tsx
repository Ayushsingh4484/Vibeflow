import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { artistService } from '../services/artistService';
import { Artist, Track } from '../types';
import { TrackTable } from '../components/common/TrackTable';
import { Card } from '../components/common/Card';
import { usePlayerStore } from '../store/usePlayerStore';
import { Play, Shuffle, CheckCircle2, User } from 'lucide-react';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';

export const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playQueue, toggleShuffle } = usePlayerStore();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    artistService
      .getArtistById(id)
      .then((res) => setArtist(res.artist))
      .catch((err) => console.error('Fetch artist error:', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="py-20 text-center text-zinc-500">Loading artist profile...</div>;
  }

  if (!artist) {
    return (
      <div className="py-20 text-center text-zinc-500">
        <h2 className="text-xl font-bold text-white mb-2">Artist not found</h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 rounded-full bg-white text-black font-semibold text-sm"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const tracks = artist.tracks || [];
  const albums = artist.albums || [];

  return (
    <div className="flex flex-col gap-8">
      {/* Artist Hero Banner */}
      <div className="relative min-h-[260px] md:min-h-[320px] p-6 flex flex-col justify-end overflow-hidden bg-gradient-to-b from-zinc-700 via-zinc-900/80 to-[#121212]">
        {artist.imageUrl && (
          <img
            src={artist.imageUrl}
            alt={artist.name}
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity blur-sm"
          />
        )}
        <div className="relative z-10 flex items-center gap-6">
          {artist.imageUrl ? (
            <img
              src={artist.imageUrl}
              alt={artist.name}
              className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover shadow-2xl border-2 border-white/10 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(artist.name)}`;
              }}
            />
          ) : (
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
              <User className="w-14 h-14 text-zinc-500" />
            </div>
          )}

          <div className="flex flex-col gap-2 min-w-0">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-400">
              <CheckCircle2 className="w-4 h-4 fill-brand-500 text-black" /> Verified Artist
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight truncate">
              {artist.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Actions & Popular Tracks */}
      <div className="px-6 flex flex-col gap-8 max-w-7xl mx-auto w-full">
        {tracks.length > 0 && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => playQueue(tracks, 0)}
              className="w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-400 text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
              title="Play Artist"
            >
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </button>
            <button
              onClick={() => {
                toggleShuffle();
                playQueue(tracks, 0);
              }}
              className="p-3 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="Shuffle Artist"
            >
              <Shuffle className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Popular Tracks */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-white tracking-tight">Popular Releases</h2>
          <TrackTable
            tracks={tracks}
            onOpenAddToPlaylist={(t) => setSelectedTrackForPlaylist(t)}
          />
        </section>

        {/* Discography / Albums */}
        {albums.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight">Discography</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {albums.map((alb) => (
                <Card
                  key={alb.id}
                  id={alb.id}
                  title={alb.title}
                  subtitle={alb.releaseDate ? alb.releaseDate.slice(0, 4) : 'Album'}
                  imageUrl={alb.coverUrl}
                  type="album"
                  linkTo={`/album/${alb.id}`}
                />
              ))}
            </div>
          </section>
        )}

        {/* About / Bio Section */}
        {artist.bio && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight">About {artist.name}</h2>
            <div className="p-6 rounded-2xl bg-[#181818] border border-white/5 text-zinc-300 text-sm leading-relaxed max-w-3xl">
              {artist.bio}
            </div>
          </section>
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
