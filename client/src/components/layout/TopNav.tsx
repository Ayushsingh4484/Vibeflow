import React, { useState, useEffect } from 'react';
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
import { searchService } from '../../services/searchService';

interface TopNavProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onSearchSelect?: (val: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSelect,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { effectiveTheme, setThemePreference } = useThemeStore();
  const toggleTheme = () => setThemePreference(effectiveTheme === 'dark' ? 'light' : 'dark');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);

  // Search input state
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; query: string }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const isSearchPage = location.pathname.startsWith('/search');

  // Load history when input gains focus
  useEffect(() => {
    if (isInputFocused && !searchQuery?.trim()) {
      fetchHistory();
    }
  }, [isInputFocused, searchQuery]);

  // Fetch search keyword suggestions as user types
  useEffect(() => {
    if (!searchQuery?.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      setSuggestionsLoading(true);
      searchService
        .getKeywordSuggestions(searchQuery.trim())
        .then((res) => {
          setSuggestions(res.suggestions || []);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setSuggestionsLoading(false));
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchHistory = () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      setHistoryLoading(true);
      searchService
        .getHistory()
        .then((res) => setHistory(res.history || []))
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
    } else {
      // Local storage fallback for guests
      try {
        const saved = JSON.parse(localStorage.getItem('vibeflow_guest_history') || '[]');
        setHistory(saved);
      } catch {
        setHistory([]);
      }
    }
  };

  const handleSelectQuery = (q: string) => {
    if (onSearchSelect) {
      onSearchSelect(q);
    } else if (onSearchChange) {
      onSearchChange(q);
    }
    // Also save to guest local storage if not logged in
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      try {
        const saved: Array<{ id: string; query: string }> = JSON.parse(
          localStorage.getItem('vibeflow_guest_history') || '[]'
        );
        const filtered = saved.filter((s) => s.query.toLowerCase() !== q.toLowerCase());
        const updated = [{ id: String(Date.now()), query: q }, ...filtered].slice(0, 10);
        localStorage.setItem('vibeflow_guest_history', JSON.stringify(updated));
      } catch {}
    }
    setIsInputFocused(false);
  };

  const handleDeleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      try {
        await searchService.deleteHistoryItem(id);
        setHistory((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        console.error('Failed to delete history item:', err);
      }
    } else {
      try {
        const saved: Array<{ id: string; query: string }> = JSON.parse(
          localStorage.getItem('vibeflow_guest_history') || '[]'
        );
        const updated = saved.filter((s) => s.id !== id);
        localStorage.setItem('vibeflow_guest_history', JSON.stringify(updated));
        setHistory(updated);
      } catch {}
    }
  };

  const handleClearAllHistory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      try {
        await searchService.clearAllHistory();
        setHistory([]);
      } catch (err) {
        console.error('Failed to clear history:', err);
      }
    } else {
      localStorage.removeItem('vibeflow_guest_history');
      setHistory([]);
    }
  };

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

        {/* Search Bar on Search Page with Live Keyword Suggestions & History */}
        {isSearchPage && onSearchChange && (
          <div className="relative flex-1 max-w-md ml-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
            <input
              type="text"
              placeholder="Search songs, artists & albums"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => {
                // Short delay so clicks inside dropdown register
                setTimeout(() => setIsInputFocused(false), 220);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery?.trim()) {
                  handleSelectQuery(searchQuery.trim());
                }
              }}
              autoFocus
              className="w-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 focus:bg-white dark:focus:bg-zinc-800 text-sm text-slate-900 dark:text-white placeholder-zinc-400 pl-10 pr-4 py-2 rounded-full border border-black/10 dark:border-white/10 focus:border-red-500 focus:outline-none transition-all shadow-sm"
            />

            {/* Keyword Suggestions Dropdown */}
            {isInputFocused && searchQuery?.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#181920] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Suggestions</span>
                  {suggestionsLoading && (
                    <span className="text-[10px] text-red-500 animate-pulse">Searching...</span>
                  )}
                </div>

                {suggestions.length > 0 ? (
                  suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectQuery(item)}
                      className="px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer flex items-center gap-2.5 text-sm text-slate-800 dark:text-zinc-200 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
                    >
                      <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-500" />
                      <span className="truncate flex-1">{item}</span>
                    </div>
                  ))
                ) : !suggestionsLoading ? (
                  <div
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectQuery(searchQuery.trim())}
                    className="px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer flex items-center gap-2.5 text-sm text-slate-800 dark:text-zinc-200 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Search for "{searchQuery}"</span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Recent Search History Dropdown when input is empty */}
            {isInputFocused && !searchQuery?.trim() && history.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#181920] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Recent Searches</span>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleClearAllHistory}
                    className="text-[11px] text-zinc-400 hover:text-red-500 transition-colors font-semibold"
                  >
                    Clear All
                  </button>
                </div>

                {history.map((item) => (
                  <div
                    key={item.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectQuery(item.query)}
                    className="px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer flex items-center justify-between text-sm text-slate-800 dark:text-zinc-200 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 mr-2">
                      <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-500" />
                      <span className="truncate">{item.query}</span>
                    </div>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                      className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-zinc-400 hover:text-red-500 transition-colors opacity-70 group-hover:opacity-100"
                      title="Remove from history"
                    >
                      <span className="text-xs">✕</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
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
