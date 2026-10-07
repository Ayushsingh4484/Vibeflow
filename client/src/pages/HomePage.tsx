import React, { useState, useEffect } from 'react';
import { trackService } from '../services/trackService';
import { albumService } from '../services/albumService';
import { artistService } from '../services/artistService';
import { playlistService } from '../services/playlistService';
import { jamendoService } from '../services/jamendoService';
import { Track, Album, Artist, Playlist } from '../types';
import { Card } from '../components/common/Card';
import { TrackTable } from '../components/common/TrackTable';
import { CardSkeleton, TrackRowSkeleton } from '../components/common/Skeleton';
import { usePlayerStore } from '../store/usePlayerStore';
import { getGreeting } from '../utils/format';
import { Play, Sparkles, Flame, Radio, Disc, Globe, RefreshCw } from 'lucide-react';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';

const DISCOVER_GENRES = [
  { label: 'Trending', value: 'popular' },
  { label: 'Chill', value: 'chill' },
  { label: 'Electronic', value: 'electronic' },
  { label: 'Rock', value: 'rock' },
  { label: 'Lo-Fi', value: 'lofi' },
  { label: 'Ambient', value: 'ambient' },
  { label: 'Jazz', value: 'jazz' },
  { label: 'Focus', value: 'focus' },
];

export const HomePage: React.FC = () => {
  const [popularTracks, setPopularTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [jamendoTracks, setJamendoTracks] = useState<Track[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('popular');
  const [jamendoLoading, setJamendoLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  const { playTrack, playQueue } = usePlayerStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tracksRes, albumsRes, artistsRes, playlistsRes] = await Promise.all([
          trackService.getTracks({ limit: 10, sort: 'popular' }),
          albumService.getAlbums({ limit: 6 }),
          artistService.getArtists({ limit: 6 }),
          playlistService.getPlaylists(6),
        ]);

        setPopularTracks(tracksRes.tracks || []);
        setAlbums(albumsRes.albums || []);
        setArtists(artistsRes.artists || []);
        setPlaylists(playlistsRes.playlists || []);

        // Fetch recent if possible
        trackService
          .getRecentlyPlayed()
          .then((res) => setRecentTracks(res.tracks || []))
          .catch(() => {});
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch Jamendo Discover Tracks
  useEffect(() => {
    let isCancelled = false;
    setJamendoLoading(true);

    const fetchJamendo = async () => {
      try {
        let res;
        if (selectedGenre === 'popular') {
          res = await jamendoService.getPopular(6);
        } else {
          res = await jamendoService.getByGenre(selectedGenre, 6);
        }
        if (!isCancelled) {
          setJamendoTracks(res.tracks || []);
        }
      } catch (err) {
        console.error('Failed to fetch Jamendo discovery tracks:', err);
        if (!isCancelled) {
          setJamendoTracks([]);
        }
      } finally {
        if (!isCancelled) {
          setJamendoLoading(false);
        }
      }
    };

    fetchJamendo();
    return () => {
      isCancelled = true;
    };
  }, [selectedGenre]);

  const greeting = getGreeting();

  return (
    <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto">
      {/* Hero Welcome & Quick Grid */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>{greeting}</span>
            <Sparkles className="w-6 h-6 text-brand-400 animate-pulse" />
          </h1>
        </div>

        {/* Quick Launch Cards (Top 6) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {playlists.slice(0, 6).map((pl) => (
            <div
              key={pl.id}
              onClick={() => {
                if (pl.tracks && pl.tracks.length > 0) {
                  playQueue(pl.tracks, 0);
                }
              }}
              className="group flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer border border-white/5 hover:border-white/10 shadow hover:shadow-lg"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {pl.coverUrl ? (
                  <img
                    src={pl.coverUrl}
                    alt={pl.name}
                    className="w-16 h-16 object-cover shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-zinc-800 flex items-center justify-center shrink-0">
                    <Disc className="w-8 h-8 text-zinc-500" />
                  </div>
                )}
                <span className="font-bold text-sm text-white truncate pr-2">
                  {pl.name}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (pl.tracks && pl.tracks.length > 0) {
                    playQueue(pl.tracks, 0);
                  }
                }}
                className="mr-3 w-10 h-10 rounded-full bg-brand-500 hover:bg-brand-400 text-black flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 hover:scale-105 active:scale-95 shrink-0"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Played Section (if any) */}
      {recentTracks.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Radio className="w-5 h-5 text-brand-400" />
              Recently Played
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentTracks.slice(0, 6).map((track) => (
              <Card
                key={track.id}
                id={track.id}
                title={track.title}
                subtitle={track.artist?.name || 'Track'}
                imageUrl={track.artworkUrl || track.coverUrl}
                type="track"
                onPlay={() => playTrack(track, recentTracks)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Popular Tracks Table */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Popular Tracks
          </h2>
          {popularTracks.length > 0 && (
            <button
              onClick={() => playQueue(popularTracks, 0)}
              className="text-xs font-bold text-brand-400 hover:text-brand-300 hover:underline uppercase tracking-wider"
            >
              Play All
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            <TrackRowSkeleton />
            <TrackRowSkeleton />
            <TrackRowSkeleton />
          </div>
        ) : (
          <div className="bg-[#181818]/40 rounded-xl p-2 border border-white/5">
            <TrackTable
              tracks={popularTracks}
              onOpenAddToPlaylist={(t) => setSelectedTrackForPlaylist(t)}
            />
          </div>
        )}
      </section>

      {/* Discover Online Music (Jamendo Catalog) */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">Discover Online Music</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Jamendo
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Explore Creative Commons & independent music streamed from Jamendo
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {DISCOVER_GENRES.map((g) => (
              <button
                key={g.value}
                onClick={() => setSelectedGenre(g.value)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedGenre === g.value
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
                }`}
              >
                {g.label}
              </button>
            ))}
            {jamendoTracks.length > 0 && (
              <button
                onClick={() => playQueue(jamendoTracks, 0)}
                className="ml-2 text-xs font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wider whitespace-nowrap"
              >
                Play All
              </button>
            )}
          </div>
        </div>

        {jamendoLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : jamendoTracks.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 bg-white/5 rounded-xl border border-white/5 text-sm">
            Online music is temporarily unavailable.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {jamendoTracks.map((track) => (
              <Card
                key={track.id}
                id={track.id}
                title={track.title}
                subtitle={track.artist?.name || 'Jamendo Artist'}
                imageUrl={track.artworkUrl || track.coverUrl}
                type="track"
                source="jamendo"
                onPlay={() => playTrack(track, jamendoTracks)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Trending Albums */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Trending Albums</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            : albums.map((alb) => (
                <Card
                  key={alb.id}
                  id={alb.id}
                  title={alb.title}
                  subtitle={alb.artist?.name || 'Album'}
                  imageUrl={alb.coverUrl}
                  type="album"
                  linkTo={`/album/${alb.id}`}
                  onPlay={() => {
                    albumService.getAlbumById(alb.id).then((res) => {
                      if (res.album.tracks && res.album.tracks.length > 0) {
                        playQueue(res.album.tracks, 0);
                      }
                    });
                  }}
                />
              ))}
        </div>
      </section>

      {/* Popular Artists */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Popular Artists</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            : artists.map((art) => (
                <Card
                  key={art.id}
                  id={art.id}
                  title={art.name}
                  subtitle="Artist"
                  imageUrl={art.imageUrl}
                  type="artist"
                  linkTo={`/artist/${art.id}`}
                  onPlay={() => {
                    artistService.getArtistById(art.id).then((res) => {
                      if (res.artist.tracks && res.artist.tracks.length > 0) {
                        playQueue(res.artist.tracks, 0);
                      }
                    });
                  }}
                />
              ))}
        </div>
      </section>

      {/* Featured Playlists */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Featured Playlists</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            : playlists.map((pl) => (
                <Card
                  key={pl.id}
                  id={pl.id}
                  title={pl.name}
                  subtitle={pl.description || 'Playlist'}
                  imageUrl={pl.coverUrl}
                  type="playlist"
                  linkTo={`/playlist/${pl.id}`}
                  onPlay={() => {
                    playlistService.getPlaylistById(pl.id).then((res) => {
                      if (res.playlist.tracks && res.playlist.tracks.length > 0) {
                        playQueue(res.playlist.tracks, 0);
                      }
                    });
                  }}
                />
              ))}
        </div>
      </section>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
