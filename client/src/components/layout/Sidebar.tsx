import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Library,
  Heart,
  Clock,
  PlusSquare,
  ShieldCheck,
  Music,
  Disc,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { playlistService } from '../../services/playlistService';
import { Playlist } from '../../types';
import { CreatePlaylistModal } from '../common/CreatePlaylistModal';

export const Sidebar: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      playlistService
        .getUserPlaylists()
        .then((res) => setPlaylists(res.playlists))
        .catch(() => {});
    } else {
      setPlaylists([]);
    }
  }, [isAuthenticated, location.pathname]);

  const handlePlaylistCreated = (newPlaylist: Playlist) => {
    setPlaylists((prev) => [newPlaylist, ...prev]);
    navigate(`/playlist/${newPlaylist.id}`);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
      isActive
        ? 'bg-white/10 text-white font-bold'
        : 'text-zinc-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <>
      <aside className="w-64 bg-[#000000] h-full flex flex-col p-3 gap-2 select-none shrink-0 border-r border-white/5">
        {/* Top Section */}
        <div className="bg-[#121212] rounded-xl p-4 flex flex-col gap-4">
          {/* Brand Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 px-2 py-1 group">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Disc className="w-5 h-5 text-black animate-spin-slow" />
            </div>
            <div className="flex items-center">
              <span className="text-xl font-black tracking-tight text-white">Vibe</span>
              <span className="text-xl font-black tracking-tight text-brand-400">Flow</span>
            </div>
          </NavLink>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            <NavLink to="/" className={navLinkClass}>
              <Home className="w-5 h-5" />
              <span>Home</span>
            </NavLink>

            <NavLink to="/search" className={navLinkClass}>
              <Search className="w-5 h-5" />
              <span>Search</span>
            </NavLink>

            <NavLink to="/library" className={navLinkClass}>
              <Library className="w-5 h-5" />
              <span>Your Library</span>
            </NavLink>
          </nav>
        </div>

        {/* Middle Section: Quick Access & Playlists */}
        <div className="bg-[#121212] rounded-xl flex-1 flex flex-col p-4 gap-4 overflow-hidden min-h-0">
          {/* Quick links */}
          <div className="flex flex-col gap-1 border-b border-white/10 pb-3">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login');
                } else {
                  setIsCreateModalOpen(true);
                }
              }}
              className="flex items-center gap-4 px-4 py-2.5 rounded-lg text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-all w-full text-left group"
            >
              <div className="w-6 h-6 rounded bg-zinc-800 group-hover:bg-brand-500 flex items-center justify-center transition-colors">
                <PlusSquare className="w-4 h-4 text-zinc-300 group-hover:text-black" />
              </div>
              <span>Create Playlist</span>
            </button>

            <NavLink to="/liked" className={navLinkClass}>
              <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-600 to-purple-400 flex items-center justify-center shadow-sm">
                <Heart className="w-3.5 h-3.5 text-white fill-current" />
              </div>
              <span>Liked Songs</span>
            </NavLink>

            <NavLink to="/recently-played" className={navLinkClass}>
              <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-zinc-300" />
              </div>
              <span>Recently Played</span>
            </NavLink>

            {user?.role === 'ADMIN' && (
              <NavLink to="/admin" className={navLinkClass}>
                <div className="w-6 h-6 rounded bg-emerald-950 border border-emerald-500/40 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-emerald-400 font-bold">Admin Portal</span>
              </NavLink>
            )}
          </div>

          {/* User Playlists Scrollable List */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 px-3 mb-2">
              Playlists
            </h3>
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-0.5">
              {playlists.length === 0 ? (
                <p className="text-xs text-zinc-500 px-3 py-2">
                  {isAuthenticated
                    ? 'No playlists yet. Click "Create Playlist" above!'
                    : 'Log in to view and create playlists.'}
                </p>
              ) : (
                playlists.map((pl) => (
                  <NavLink
                    key={pl.id}
                    to={`/playlist/${pl.id}`}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-xs transition-colors truncate ${
                        isActive
                          ? 'text-brand-400 font-semibold bg-white/5'
                          : 'text-zinc-400 hover:text-white'
                      }`
                    }
                  >
                    <Music className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{pl.name}</span>
                  </NavLink>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>

      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handlePlaylistCreated}
      />
    </>
  );
};
