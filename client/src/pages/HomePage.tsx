import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAuthStore } from '../store/useAuthStore';
import { getGreeting } from '../utils/format';
import {
  Play,
  Sparkles,
  Flame,
  Radio,
  Disc,
  Globe,
  Search,
  ChevronRight,
  Music,
  Heart,
} from 'lucide-react';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';

const DISCOVER_GENRES = [
  { label: 'Popular', value: 'popular' },
  { label: 'Chill Vibes', value: 'chill' },
  { label: 'Lo-Fi Beats', value: 'lofi' },
  { label: 'Electronic', value: 'electronic' },
  { label: 'Rock', value: 'rock' },
  { label: 'Focus & Study', value: 'focus' },
  { label: 'Ambient', value: 'ambient' },
  { label: 'Jazz Night', value: 'jazz' },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { playTrack, playQueue } = usePlayerStore();

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tracksRes, albumsRes, artistsRes, playlistsRes] = await Promise.all([
          trackService.getTracks({ limit: 10, sort: 'popular' }),
          albumService.getAlbums({ limit: 8 }),
          artistService.getArtists({ limit: 8 }),
          playlistService.getPlaylists(8),
        ]);

        setPopularTracks(tracksRes.tracks || []);
        setAlbums(albumsRes.albums || []);
        setArtists(artistsRes.artists || []);
        setPlaylists(playlistsRes.playlists || []);

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

  useEffect(() => {
    let isCancelled = false;
    setJamendoLoading(true);

    const fetchJamendo = async () => {
      try {
        let res;
        if (selectedGenre === 'popular') {
          res = await jamendoService.getPopular(8);
        } else {
          res = await jamendoService.getByGenre(selectedGenre, 8);
        }
        if (!isCancelled) {
          setJamendoTracks(res.tracks || []);
        }
      } catch (err) {
        console.error('Failed to fetch Jamendo tracks:', err);
        if (!isCancelled) setJamendoTracks([]);
      } finally {
        if (!isCancelled) setJamendoLoading(false);
      }
    };

    fetchJamendo();
    return () => {
      isCancelled = true;
    };
  }, [selectedGenre]);

  const greeting = getGreeting();
  const userName = user?.name ? user.name.split(' ')[0] : 'Alex';

  // Featured Hero Card item (uses top playlist or fallback)
  const heroFeatured = playlists[0] || {
    id: 'hero-1',
    name: 'Late Night Frequencies',
    description:
      'Take a moment to unwind and immerse yourself in a world of soothing melodies, carefully curated to enhance your evening experience.',
    coverUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
    tracks: popularTracks,
  };

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 1. Top Section: Clean Greeting & Search Bar */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {greeting}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{userName}</span>
            <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
          </h1>
        </div>

        {/* Large Rounded Pill Search Bar */}
        <div
          onClick={() => navigate('/search')}
          className="group relative flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#1c1d24] hover:bg-zinc-50 dark:hover:bg-[#252632] rounded-full border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300"
        >
          <Search className="w-5 h-5 text-zinc-400 group-hover:text-red-500 transition-colors" />
          <span className="text-sm font-medium text-zinc-400 dark:text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors">
            Search songs, artists & albums
          </span>
        </div>
      </section>

      {/* 2. Featured Music Section (Cinematic Hero Card inspired by Reference) */}
      <section className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-black/5 dark:border-white/10 min-h-[340px] sm:min-h-[380px] flex flex-col justify-between p-6 sm:p-8 bg-zinc-900 text-white group">
        {/* Background Image with Dark Gradient Overlay */}
        <img
          src={
            heroFeatured.coverUrl ||
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop'
          }
          alt={heroFeatured.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />

        {/* Top Tag / Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-md">
            Mood of the week
          </span>
        </div>

        {/* Middle Content */}
        <div className="relative z-10 flex flex-col gap-2 max-w-xl my-4">
          <span className="text-xs font-bold uppercase tracking-widest text-red-400">
            Featured Playlist
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
            {heroFeatured.name}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 font-medium line-clamp-2 max-w-lg leading-relaxed">
            {heroFeatured.description ||
              'Take a moment to unwind with atmospheric sounds, carefully curated for an unforgettable evening listening session.'}
          </p>
        </div>

        {/* Bottom Metadata Pill Bar (Artist Avatar + Track Count + Play Button) */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/15">
            <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center font-bold text-xs text-white shadow-md">
              N
            </div>
            <span className="text-xs font-bold text-white tracking-wide">
              Nova • {heroFeatured.tracks?.length || 12} Tracks
            </span>
          </div>

          <button
            onClick={() => {
              if (heroFeatured.tracks && heroFeatured.tracks.length > 0) {
                playQueue(heroFeatured.tracks, 0);
              } else if (popularTracks.length > 0) {
                playQueue(popularTracks, 0);
              }
            }}
            className="px-6 py-2.5 rounded-full bg-white hover:bg-red-500 text-slate-900 hover:text-white font-extrabold text-sm shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play</span>
          </button>
        </div>
      </section>

      {/* 3. Horizontal Carousel: Recently Played */}
      {recentTracks.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              Recently Played
            </h2>
            <button
              onClick={() => navigate('/recently-played')}
              className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-0.5"
            >
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-2 px-2">
            {recentTracks.map((track) => (
              <div key={track.id} className="w-40 sm:w-48 shrink-0">
                <Card
                  id={track.id}
                  title={track.title}
                  subtitle={track.artist?.name || 'Track'}
                  imageUrl={track.artworkUrl || track.coverUrl}
                  type="track"
                  onPlay={() => playTrack(track, recentTracks)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Horizontal Carousel: Discover Jamendo Music */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Discover Online Music
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Explore independent tracks streamed directly from Jamendo
            </p>
          </div>

          {/* Genre Pill Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {DISCOVER_GENRES.map((g) => (
              <button
                key={g.value}
                onClick={() => setSelectedGenre(g.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedGenre === g.value
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                    : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-slate-700 dark:text-zinc-300'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {jamendoLoading ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-40 sm:w-48 shrink-0">
                <CardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-2 px-2">
            {jamendoTracks.map((track) => (
              <div key={track.id} className="w-40 sm:w-48 shrink-0">
                <Card
                  id={track.id}
                  title={track.title}
                  subtitle={track.artist?.name || 'Jamendo Artist'}
                  imageUrl={track.artworkUrl || track.coverUrl}
                  type="track"
                  source="jamendo"
                  onPlay={() => playTrack(track, jamendoTracks)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Popular Songs Table Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            Popular Tracks
          </h2>
          {popularTracks.length > 0 && (
            <button
              onClick={() => playQueue(popularTracks, 0)}
              className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
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
          <div className="bg-white dark:bg-[#16171e] rounded-2xl md:rounded-3xl p-2 md:p-3 border border-black/5 dark:border-white/5 shadow-sm">
            <TrackTable
              tracks={popularTracks}
              onOpenAddToPlaylist={(t) => setSelectedTrackForPlaylist(t)}
            />
          </div>
        )}
      </section>

      {/* 6. Trending Albums Horizontal Carousel */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Trending Albums
          </h2>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-2 px-2">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-40 sm:w-48 shrink-0">
                  <CardSkeleton />
                </div>
              ))
            : albums.map((alb) => (
                <div key={alb.id} className="w-40 sm:w-48 shrink-0">
                  <Card
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
                </div>
              ))}
        </div>
      </section>

      {/* 7. Popular Artists Horizontal Carousel */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Popular Artists
          </h2>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-2 px-2">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-40 sm:w-48 shrink-0">
                  <CardSkeleton />
                </div>
              ))
            : artists.map((art) => (
                <div key={art.id} className="w-40 sm:w-48 shrink-0">
                  <Card
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
                </div>
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
