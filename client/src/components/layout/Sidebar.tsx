import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Library,
  Sparkles,
  Heart,
  Clock,
  PlusSquare,
  ShieldCheck,
  Music,
  Disc,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { playlistService } from '../../services/playlistService';
import { Playlist } from '../../types';
import { CreatePlaylistModal } from '../common/CreatePlaylistModal';
import { LiquidNavContainer } from '../common/LiquidNavIndicator';

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
    `liquid-btn relative z-10 flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors duration-200 select-none ${
      isActive
        ? 'text-white'
        : 'text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
    }`;

  return (
    <>
      <aside className="w-64 h-full flex flex-col p-3 gap-3 select-none shrink-0 transition-colors bg-transparent">
        {/* Top Section: Frosted Liquid Glass */}
        <div className="relative overflow-hidden bg-white/70 dark:bg-[#11131c]/65 backdrop-blur-2xl rounded-3xl p-4 flex flex-col gap-4 border border-white/60 dark:border-white/10 shadow-lg">
          {/* Specular top reflection */}
          <div className="liquid-specular-top" />

          {/* Brand Logo */}
          <NavLink to="/" className="flex items-center gap-3 px-2 py-1 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/35 group-hover:scale-105 transition-transform border-t border-white/40">
              <Disc className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div className="flex items-center">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Vibe</span>
              <span className="text-xl font-black tracking-tight text-red-500">Flow</span>
            </div>
          </NavLink>

          {/* Navigation Links with Liquid Water-Drop Effect */}
          <LiquidNavContainer direction="vertical" className="flex flex-col gap-1">
            <NavLink to="/" className={navLinkClass}>
              <Home className="w-5 h-5" />
              <span>Home</span>
            </NavLink>

            <NavLink to="/library" className={navLinkClass}>
              <Library className="w-5 h-5" />
              <span>Library</span>
            </NavLink>

            <NavLink to="/suggestions" className={navLinkClass}>
              {({ isActive }) => (
                <>
                  <Sparkles className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-red-500'}`} />
                  <span>Suggestions</span>
                </>
              )}
            </NavLink>

            <NavLink to="/playlists" className={navLinkClass}>
              {({ isActive }) => (
                <>
                  <Music className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-red-500'}`} />
                  <span>Curated Playlists</span>
                </>
              )}
            </NavLink>
          </LiquidNavContainer>
        </div>

        {/* Middle Section: Quick Access & Playlists */}
        <div className="relative overflow-hidden bg-white/70 dark:bg-[#11131c]/65 backdrop-blur-2xl rounded-3xl flex-1 flex flex-col p-4 gap-4 min-h-0 border border-white/60 dark:border-white/10 shadow-lg">
          {/* Specular top reflection */}
          <div className="liquid-specular-top" />

          {/* Quick links with Liquid Water-Drop Effect */}
          <div className="flex flex-col gap-1 border-b border-black/5 dark:border-white/10 pb-3">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login');
                } else {
                  setIsCreateModalOpen(true);
                }
              }}
              className="liquid-btn flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/8 transition-all w-full text-left group"
            >
              <div className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/10 group-hover:bg-red-500 flex items-center justify-center transition-colors border border-black/5 dark:border-white/10">
                <PlusSquare className="w-4 h-4 text-zinc-600 dark:text-zinc-300 group-hover:text-white" />
              </div>
              <span>Create Playlist</span>
            </button>

            <LiquidNavContainer direction="vertical" className="flex flex-col gap-1">
              <NavLink to="/liked" className={navLinkClass}>
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm border-t border-white/30">
                  <Heart className="w-3.5 h-3.5 text-white fill-current" />
                </div>
                <span>Liked Songs</span>
              </NavLink>

              <NavLink to="/recently-played" className={navLinkClass}>
                <div className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center border border-black/5 dark:border-white/10">
                  <Clock className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
                </div>
                <span>Recently Played</span>
              </NavLink>

              <NavLink to="/settings" className={navLinkClass}>
                <div className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center border border-black/5 dark:border-white/10">
                  <Settings className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
                </div>
                <span>Settings</span>
              </NavLink>

              {user?.role === 'ADMIN' && (
                <NavLink to="/admin" className={navLinkClass}>
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span className="text-emerald-500 font-bold">Admin Portal</span>
                </NavLink>
              )}
            </LiquidNavContainer>
          </div>

          {/* User Playlists Scrollable List */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-3 mb-2">
              Playlists
            </h3>
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-0.5 no-scrollbar">
              {playlists.length === 0 ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 px-3 py-2">
                  {isAuthenticated
                    ? 'No playlists yet. Create one above!'
                    : 'Log in to view playlists.'}
                </p>
              ) : (
                playlists.map((pl) => (
                  <NavLink
                    key={pl.id}
                    to={`/playlist/${pl.id}`}
                    className={({ isActive }) =>
                      `liquid-btn flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all truncate ${
                        isActive
                          ? 'text-red-500 bg-red-500/15 border border-red-500/20 font-bold shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
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
