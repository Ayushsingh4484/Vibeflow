import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { artistService, DynamicArtistProfile, ArtistYouTubePlaylist } from '../services/artistService';
import { Track } from '../types';
import { TrackTable } from '../components/common/TrackTable';
import { Card } from '../components/common/Card';
import { usePlayerStore } from '../store/usePlayerStore';
import { Play, Shuffle, CheckCircle2, User, ListMusic, Sparkles, Disc } from 'lucide-react';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';
import { ArtistAvatar } from '../components/common/ArtistAvatar';

export const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playQueue, toggleShuffle } = usePlayerStore();

  const [artist, setArtist] = useState<DynamicArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingPlaylistId, setPlayingPlaylistId] = useState<string | null>(null);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // Try dynamic artist retrieval first (supports catalog names/slugs & dynamic YouTube artists)
    artistService
      .getDynamicArtist(id)
      .then((res) => {
        if (res.artist && res.artist.tracks && res.artist.tracks.length > 0) {
          setArtist(res.artist);
        } else {
          // Fallback to database artist if dynamic didn't return tracks
          return artistService.getArtistById(id).then((dbRes) => setArtist(dbRes.artist as any));
        }
      })
      .catch(() => {
        // Fallback to database artist
        return artistService
          .getArtistById(id)
          .then((dbRes) => setArtist(dbRes.artist as any))
          .catch((err) => console.error('Fetch artist error:', err));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePlayPlaylist = async (playlist: ArtistYouTubePlaylist) => {
    try {
      setPlayingPlaylistId(playlist.id);
      const res = await artistService.getPlaylistTracks(playlist.ytPlaylistId || playlist.id);
      if (res.tracks && res.tracks.length > 0) {
        playQueue(res.tracks, 0);
      }
    } catch (err) {
      console.error('Failed to play YouTube playlist:', err);
    } finally {
      setPlayingPlaylistId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-400 flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
          Loading artist profile, tracks & playlists...
        </p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="py-20 text-center text-zinc-500">
        <h2 className="text-xl font-bold text-white mb-2">Artist not found</h2>
        <button
          onClick={() => navigate('/artists')}
          className="px-6 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-red-600/30"
        >
          Explore All Artists
        </button>
      </div>
    );
  }

  const tracks = artist.tracks || [];
  const albums = artist.albums || [];
  const playlists = artist.playlists || [];

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Artist Hero Banner */}
      <div className="relative min-h-[280px] md:min-h-[340px] p-6 md:p-10 flex flex-col justify-end overflow-hidden bg-gradient-to-b from-zinc-800 via-zinc-900/90 to-[#0e0e12] rounded-3xl border border-white/5 shadow-2xl">
        {artist.imageUrl && (
          <img
            src={artist.imageUrl}
            alt={artist.name}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity blur-md scale-105"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (artist.imageUrl && !img.src.includes('/api/stream/image')) {
                img.src = `/api/stream/image?url=${encodeURIComponent(artist.imageUrl)}`;
              }
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e12] via-[#0e0e12]/60 to-transparent" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end gap-6">
          <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full overflow-hidden shadow-2xl border-4 border-white/10 shrink-0 ring-4 ring-black/40 bg-zinc-800">
            <ArtistAvatar
              src={artist.imageUrl}
              name={artist.name}
              loading="eager"
            />
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 fill-red-500 text-white" /> Verified Artist
              </span>
              {artist.category && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-zinc-300">
                  {artist.category}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight truncate drop-shadow-md">
              {artist.name}
            </h1>

            {artist.monthlyListeners && (
              <p className="text-xs sm:text-sm font-semibold text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{artist.monthlyListeners} monthly listeners</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="px-2 sm:px-6 flex flex-col gap-9 max-w-7xl mx-auto w-full">
        {/* Play & Shuffle Action Buttons */}
        {tracks.length > 0 && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => playQueue(tracks, 0)}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all"
              title="Play Artist"
            >
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </button>
            <button
              onClick={() => {
                toggleShuffle();
                playQueue(tracks, 0);
              }}
              className="p-3 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
              title="Shuffle Artist"
            >
              <Shuffle className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Popular Tracks Table */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Disc className="w-6 h-6 text-red-500" />
              Popular Tracks
            </h2>
            {tracks.length > 0 && (
              <button
                onClick={() => playQueue(tracks, 0)}
                className="text-xs font-bold text-red-500 hover:text-red-400 uppercase tracking-wider"
              >
                Play All ({tracks.length})
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-[#16171e] rounded-2xl md:rounded-3xl p-2 md:p-3 border border-black/5 dark:border-white/5 shadow-sm">
            <TrackTable
              tracks={tracks}
              onOpenAddToPlaylist={(t) => setSelectedTrackForPlaylist(t)}
            />
          </div>
        </section>

        {/* Artist-Related YouTube Music Playlists */}
        {playlists.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <ListMusic className="w-6 h-6 text-red-500" />
                  Artist Playlists & Collections
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Curated YouTube Music playlists featuring {artist.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => handlePlayPlaylist(pl)}
                  className="group relative p-3.5 rounded-2xl bg-[#16171e] hover:bg-[#1f202b] border border-white/5 hover:border-red-500/30 transition-all duration-300 cursor-pointer flex flex-col gap-3 shadow-md hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900">
                    <img
                      src={pl.coverUrl}
                      alt={pl.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />

                    <div className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105">
                      {playingPlaylistId === pl.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                      {pl.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-1">{pl.channelTitle}</p>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mt-0.5">
                      {pl.trackCount} Tracks • YouTube Music
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Discography / Albums if available */}
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
            <div className="p-6 rounded-3xl bg-[#16171e] border border-white/5 text-zinc-300 text-sm leading-relaxed max-w-4xl shadow-md">
              <p>{artist.bio}</p>
              {artist.region && (
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-6 text-xs text-zinc-400">
                  <div>
                    <span className="text-zinc-500 uppercase text-[10px] block font-bold">Region</span>
                    <span className="font-semibold text-white">{artist.region}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase text-[10px] block font-bold">Genre</span>
                    <span className="font-semibold text-white">{artist.category || 'Various'}</span>
                  </div>
                </div>
              )}
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
