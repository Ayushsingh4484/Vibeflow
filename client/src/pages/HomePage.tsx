import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackService } from '../services/trackService';
import { albumService } from '../services/albumService';
import { artistService, CatalogArtistItem } from '../services/artistService';
import { playlistService } from '../services/playlistService';
import { Track, Album, Playlist, PrebuiltPlaylist } from '../types';
import { Card } from '../components/common/Card';
import { PlaylistCard } from '../components/common/PlaylistCard';
import { TrackTable } from '../components/common/TrackTable';
import { CardSkeleton, TrackRowSkeleton } from '../components/common/Skeleton';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { getGreeting } from '../utils/format';
import { HOME_GENRE_CATEGORIES } from '../constants/genreCategories';
import {
  Play,
  Sparkles,
  Flame,
  Radio,
  Search,
  ChevronRight,
  Compass,
  Users,
} from 'lucide-react';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';
import { ArtistAvatar } from '../components/common/ArtistAvatar';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { playTrack, playQueue } = usePlayerStore();

  const [popularTracks, setPopularTracks] = useState<Track[]>([]);
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [catalogArtists, setCatalogArtists] = useState<CatalogArtistItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [prebuiltPlaylists, setPrebuiltPlaylists] = useState<PrebuiltPlaylist[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(true);
  const [playingArtistId, setPlayingArtistId] = useState<string | null>(null);
  const [playingPlaylistId, setPlayingPlaylistId] = useState<string | null>(null);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setSuggestionsLoading(true);
      try {
        const [tracksRes, albumsRes, catalogRes, playlistsRes, suggestionsRes, prebuiltRes] = await Promise.all([
          trackService.getTracks({ limit: 10, sort: 'popular' }),
          albumService.getAlbums({ limit: 8 }),
          artistService.getCatalog({ limit: 22 } as any),
          playlistService.getPlaylists(8),
          trackService.getSuggestions().catch(() => ({ recommendations: [], sections: [] })),
          playlistService.getPrebuiltPlaylists().catch(() => ({ playlists: [] })),
        ]);

        setPopularTracks(tracksRes.tracks || []);
        setAlbums(albumsRes.albums || []);
        setCatalogArtists(catalogRes.artists || []);
        setPlaylists(playlistsRes.playlists || []);
        setRecommendations(suggestionsRes.recommendations || []);
        setPrebuiltPlaylists(prebuiltRes.playlists || []);
        setSuggestionsLoading(false);

        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          trackService
            .getRecentlyPlayed()
            .then((res) => setRecentTracks(res.tracks || []))
            .catch(() => {});
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const greeting = getGreeting();
  const userName = user?.name ? user.name.split(' ')[0] : 'Alex';

  const handlePlayArtist = async (e: React.MouseEvent, artist: CatalogArtistItem) => {
    e.stopPropagation();
    setPlayingArtistId(artist.id);
    try {
      const res = await artistService.getDynamicArtist(artist.name);
      if (res.artist?.tracks && res.artist.tracks.length > 0) {
        playQueue(res.artist.tracks, 0);
      }
    } catch (err) {
      console.error('Failed to play artist tracks:', err);
    } finally {
      setPlayingArtistId(null);
    }
  };

  const handlePlayPrebuilt = async (e: React.MouseEvent, pl: PrebuiltPlaylist | Playlist) => {
    e.stopPropagation();
    setPlayingPlaylistId(pl.id);
    try {
      const res = await playlistService.getPrebuiltPlaylistById(pl.id);
      if (res.playlist?.tracks && res.playlist.tracks.length > 0) {
        playQueue(res.playlist.tracks, 0);
      }
    } catch (err) {
      console.error('Failed to play prebuilt playlist:', err);
    } finally {
      setPlayingPlaylistId(null);
    }
  };

  const handleSelectCategory = (query: string) => {
    window.dispatchEvent(new CustomEvent('vibeflow-search', { detail: query }));
  };

  return (
    <div className="flex flex-col gap-9 p-4 sm:p-6 max-w-7xl mx-auto pb-14">
      {/* 0. Top Section: Clean Greeting & Search Bar */}
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
          className="liquid-btn group relative flex items-center gap-3 px-5 py-3.5 bg-white/70 dark:bg-[#141622]/65 hover:bg-white/90 dark:hover:bg-[#1c1e2e]/80 rounded-full border border-black/10 dark:border-white/10 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-200 backdrop-blur-xl overflow-hidden"
        >
          <div className="liquid-specular-top" />
          <Search className="w-5 h-5 text-zinc-400 group-hover:text-red-500 transition-colors" />
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
            Search songs, artists & albums
          </span>
        </div>
      </section>

      {/* 1. Recommended For You */}
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Inspired by your recent activity
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
              Recommended for you
            </h2>
          </div>
          <button
            onClick={() => navigate('/suggestions')}
            className="liquid-btn text-xs sm:text-sm font-extrabold text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-full hover:bg-red-500/10"
          >
            <span>Show all</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontally scrollable row of recommended tracks */}
        {suggestionsLoading ? (
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-2 px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-40 sm:w-48 shrink-0">
                <CardSkeleton />
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="p-6 rounded-3xl bg-white/40 dark:bg-[#16171e]/40 backdrop-blur-xl border border-black/5 dark:border-white/10 text-center text-xs text-zinc-400">
            Start playing songs to receive tailored recommendations.
          </div>
        ) : (
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-2 px-2">
            {recommendations.map((track) => (
              <div key={track.id} className="w-40 sm:w-48 shrink-0">
                <Card
                  id={track.id}
                  title={track.title}
                  subtitle={track.artist?.name || 'Artist'}
                  imageUrl={track.artworkUrl || track.coverUrl}
                  type="track"
                  source={track.source}
                  onPlay={() => playTrack(track, recommendations)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Browse All Categories */}
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-red-500" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Browse All Categories
          </h2>
        </div>

        {/* Horizontal scrollable row of curated category cards with real images */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-2 px-2">
          {HOME_GENRE_CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              onClick={() => handleSelectCategory(cat.query)}
              className="liquid-btn group relative w-36 sm:w-44 h-36 sm:h-44 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-white/20 shrink-0 flex flex-col justify-between p-3.5 sm:p-4 select-none bg-zinc-900"
            >
              <div className="liquid-specular-top opacity-60 group-hover:opacity-100 transition-opacity" />
              <img
                src={cat.imageUrl}
                alt={cat.name}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
                }}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out brightness-90 group-hover:brightness-100"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient} opacity-90 group-hover:opacity-80 transition-opacity`} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/80" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-red-600 transition-opacity duration-300 pointer-events-none" />

              <div className="relative z-10 flex flex-col items-start">
                <h3 className="text-sm sm:text-base font-black text-white tracking-tight drop-shadow-md group-hover:text-red-400 transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[10px] font-semibold text-zinc-300/90 tracking-wide drop-shadow line-clamp-1 mt-0.5">
                  {cat.artistHint}
                </span>
              </div>

              <div className="relative z-10 self-end">
                <div className="liquid-btn w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 border-t border-white/40">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2.5. Made for Your Mood (Pre-built Playlists) */}
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
              Made for Your Mood
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
              Your next favorite playlist is waiting.
            </p>
          </div>
          <button
            onClick={() => navigate('/playlists')}
            className="liquid-btn text-xs sm:text-sm font-extrabold text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-full hover:bg-red-500/10"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontally scrollable row of playlist cards */}
        {loading ? (
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-2 px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-44 sm:w-52 shrink-0">
                <CardSkeleton />
              </div>
            ))}
          </div>
        ) : prebuiltPlaylists.length === 0 ? (
          <div className="p-6 rounded-3xl bg-white/40 dark:bg-[#16171e]/40 backdrop-blur-xl border border-black/5 dark:border-white/10 text-center text-xs text-zinc-400">
            No curated playlists available.
          </div>
        ) : (
          <div className="flex items-center gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-2 px-2">
            {prebuiltPlaylists.map((pl) => (
              <div key={pl.id} className="w-44 sm:w-52 shrink-0">
                <PlaylistCard
                  playlist={pl}
                  isPlaying={playingPlaylistId === pl.id}
                  onPlay={handlePlayPrebuilt}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Browse by Artist (DIRECTLY BELOW BROWSE ALL CATEGORIES) */}
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-red-500" />
              Browse by Artist
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
              Find your favorite artists and explore their music.
            </p>
          </div>
          <button
            onClick={() => navigate('/artists')}
            className="liquid-btn text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-0.5 transition-colors"
          >
            See all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontally scrollable row of circular artist portrait cards */}
        {loading ? (
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-2 px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-36 sm:w-44 shrink-0 flex flex-col items-center gap-2">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-zinc-800 animate-pulse" />
                <div className="w-20 h-3 bg-zinc-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : catalogArtists.length === 0 ? (
          <div className="p-6 rounded-3xl bg-white/40 dark:bg-[#16171e]/40 backdrop-blur-xl border border-black/5 dark:border-white/10 text-center text-xs text-zinc-400">
            No artists available.
          </div>
        ) : (
          <div className="flex items-center gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-2 px-2">
            {catalogArtists.map((artist) => (
              <div
                key={artist.id}
                onClick={() => navigate(`/artist/${encodeURIComponent(artist.name)}`)}
                className="liquid-glass-card group relative w-36 sm:w-44 p-3.5 rounded-3xl cursor-pointer flex flex-col items-center text-center shrink-0 select-none overflow-hidden"
              >
                <div className="liquid-specular-top opacity-60 group-hover:opacity-100 transition-opacity" />
                {/* Circular Portrait with Floating Play Button on Hover */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full mb-3 overflow-hidden bg-zinc-800 shadow-md border-2 border-transparent group-hover:border-red-500/50 transition-colors">
                  <ArtistAvatar
                    src={artist.imageUrl}
                    name={artist.name}
                    loading="lazy"
                    imgClassName="group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                  {/* Play Button Revealed on Hover */}
                  <button
                    onClick={(e) => handlePlayArtist(e, artist)}
                    title={`Play ${artist.name}`}
                    className="absolute bottom-1 right-1 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-600/40 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95"
                  >
                    {playingArtistId === artist.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                </div>

                {/* Artist Name & Tag */}
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-red-500 transition-colors line-clamp-1 w-full">
                  {artist.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    {artist.category}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-500 text-xs">•</span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {artist.region}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Horizontal Carousel: Recently Played */}
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


      {/* 6. Popular & YouTube Trending Songs Table Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Popular & YouTube Trending
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-600/15 text-red-600 dark:text-red-400 border border-red-500/20">
              Top 10 Live
            </span>
          </div>
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

      {/* 7. Trending Albums Horizontal Carousel */}
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

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
