import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface TopNavProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ searchQuery, onSearchChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isSearchPage = location.pathname.startsWith('/search');

  return (
    <header className="h-16 px-6 glass-nav flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Navigation history & search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-black/70 hover:bg-black text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 rounded-full bg-black/70 hover:bg-black text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
            title="Go forward"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar on Search Page or clickable input */}
        {isSearchPage && onSearchChange ? (
          <div className="relative flex-1 max-w-md ml-2">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="What do you want to play?"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
              className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#333333] text-sm text-white placeholder-zinc-400 pl-10 pr-4 py-2 rounded-full border border-transparent focus:border-white/20 focus:outline-none transition-all shadow-inner"
            />
          </div>
        ) : null}
      </div>

      {/* Right: Auth / Profile */}
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1 pr-3 bg-black/60 hover:bg-black/80 rounded-full border border-white/10 hover:border-white/20 transition-all cursor-pointer"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-black font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-white max-w-[120px] truncate">
                {user.name}
              </span>
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 top-11 z-50 w-52 bg-[#282828] border border-white/10 rounded-xl shadow-2xl py-1.5 text-xs text-zinc-200 animate-slide-up">
                  <div className="px-3.5 py-2 border-b border-white/10">
                    <p className="font-semibold text-white truncate">{user.name}</p>
                    <p className="text-zinc-400 truncate text-[11px]">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 transition-colors"
                  >
                    <User className="w-4 h-4 text-zinc-400" />
                    Profile & Settings
                  </Link>

                  {user.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-emerald-400 hover:bg-emerald-500/10 transition-colors font-semibold"
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
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-white/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="text-xs md:text-sm font-bold text-zinc-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign up
            </Link>
            <Link
              to="/login"
              className="bg-white hover:bg-zinc-200 text-black text-xs md:text-sm font-bold px-5 py-2 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Log in
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
