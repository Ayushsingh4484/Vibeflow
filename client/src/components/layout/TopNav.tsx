import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  ShieldCheck,
  Search,
  Bell,
  Sun,
  Moon,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

interface TopNavProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ searchQuery, onSearchChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { effectiveTheme, setThemePreference } = useThemeStore();
  const toggleTheme = () => setThemePreference(effectiveTheme === 'dark' ? 'light' : 'dark');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);

  const isSearchPage = location.pathname.startsWith('/search');

  return (
    <header className="h-16 px-4 md:px-6 glass-nav flex items-center justify-between sticky top-0 z-20 select-none transition-colors">
      {/* Navigation history & search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-slate-700 dark:text-zinc-300 flex items-center justify-center transition-colors"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-slate-700 dark:text-zinc-300 flex items-center justify-center transition-colors"
            title="Go forward"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar on Search Page or Clickable Input */}
        {isSearchPage && onSearchChange ? (
          <div className="relative flex-1 max-w-md ml-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search songs, artists & albums"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
              className="w-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 focus:bg-white dark:focus:bg-zinc-800 text-sm text-slate-900 dark:text-white placeholder-zinc-400 pl-10 pr-4 py-2 rounded-full border border-black/10 dark:border-white/10 focus:border-red-500 focus:outline-none transition-all shadow-sm"
            />
          </div>
        ) : (
          <div
            onClick={() => navigate('/search')}
            className="hidden md:flex items-center gap-2.5 px-4 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 rounded-full text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer transition-all border border-black/5 dark:border-white/5 flex-1 max-w-sm"
          >
            <Search className="w-4 h-4 text-zinc-400" />
            <span>Search songs, artists & albums...</span>
          </div>
        )}
      </div>

      {/* Right Actions: Single Profile Avatar Entry Point */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* User Profile / Auth */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 pr-3 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full border border-black/5 dark:border-white/10 transition-all cursor-pointer"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover shadow-sm"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-red-500 text-white font-extrabold text-xs flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-bold text-slate-900 dark:text-white max-w-[100px] truncate hidden sm:inline-block">
                {user.name}
              </span>
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 top-11 z-50 w-56 bg-white dark:bg-[#1f2029] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl py-2 text-xs text-slate-700 dark:text-zinc-200 animate-slide-up">
                  <div className="px-4 py-2 border-b border-black/5 dark:border-white/10">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-zinc-500 dark:text-zinc-400 truncate text-[11px]">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <User className="w-4 h-4 text-zinc-400" />
                    Profile
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-zinc-400" />
                    Settings
                  </Link>

                  {user.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors font-bold"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-rose-500 hover:bg-rose-500/10 transition-colors border-t border-black/5 dark:border-white/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/register"
              className="text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign up
            </Link>
            <Link
              to="/login"
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Log in
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
