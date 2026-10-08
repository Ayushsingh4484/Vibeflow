import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useThemeStore, ThemePreference } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import {
  Sun,
  Moon,
  Laptop,
  Sliders,
  Bell,
  User,
  Info,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Volume2,
  Check,
  FileText,
  Lock,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { themePreference, setThemePreference, effectiveTheme } = useThemeStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  // Local state for UI controls without backend pretend
  const [autoplay, setAutoplay] = useState(true);
  const [crossfade, setCrossfade] = useState(0);
  const [audioQuality, setAudioQuality] = useState<'normal' | 'high' | 'very_high'>('high');

  const [pushNotifications, setPushNotifications] = useState(true);
  const [recommendations, setRecommendations] = useState(true);
  const [playlistUpdates, setPlaylistUpdates] = useState(false);

  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);

  const themeOptions: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
    { value: 'system', label: 'System', icon: <Laptop className="w-4 h-4" /> },
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Settings
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Manage your audio preferences, app appearance, notifications, and account details.
        </p>
      </div>

      {/* 1. Appearance Section */}
      <section className="bg-white dark:bg-[#0A0A0A] rounded-3xl p-6 border border-black/5 dark:border-[#222222] shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-[#222222]">
          <Sun className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            Appearance
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Theme Preference</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Currently active: <span className="capitalize font-semibold text-red-500">{effectiveTheme} Mode</span> ({themePreference})
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-black/5 dark:bg-[#111111] p-1.5 rounded-full border border-black/5 dark:border-[#222222]">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setThemePreference(opt.value);
                  addToast(`Theme preference set to ${opt.label}`, 'info');
                }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  themePreference === opt.value
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Playback Section */}
      <section className="bg-white dark:bg-[#0A0A0A] rounded-3xl p-6 border border-black/5 dark:border-[#222222] shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-[#222222]">
          <Sliders className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            Playback
          </h2>
        </div>

        {/* Autoplay Toggle */}
        <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-[#222222]/50">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Autoplay</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Keep listening to similar songs when your music ends
            </p>
          </div>
          <button
            onClick={() => setAutoplay(!autoplay)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              autoplay ? 'bg-red-500 justify-end' : 'bg-zinc-300 dark:bg-[#222222] justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Crossfade Slider */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-black/5 dark:border-[#222222]/50">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Crossfade Songs</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {crossfade === 0 ? 'Off' : `${crossfade} seconds gapless transition`}
            </p>
          </div>
          <div className="flex items-center gap-3 w-48">
            <input
              type="range"
              min={0}
              max={12}
              value={crossfade}
              onChange={(e) => setCrossfade(parseInt(e.target.value))}
              className="w-full h-1.5 bg-zinc-200 dark:bg-[#222222] rounded-full accent-red-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums w-8 text-right">
              {crossfade}s
            </span>
          </div>
        </div>

        {/* Audio Quality */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Streaming Audio Quality</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Optimize audio bandwidth and sound resolution
            </p>
          </div>
          <select
            value={audioQuality}
            onChange={(e: any) => setAudioQuality(e.target.value)}
            className="bg-black/5 dark:bg-[#111111] border border-black/10 dark:border-[#222222] rounded-2xl px-3.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="normal">Normal (96 kbps)</option>
            <option value="high">High (160 kbps)</option>
            <option value="very_high">Very High (320 kbps Lossless)</option>
          </select>
        </div>
      </section>

      {/* 3. Notifications Section */}
      <section className="bg-white dark:bg-[#0A0A0A] rounded-3xl p-6 border border-black/5 dark:border-[#222222] shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-[#222222]">
          <Bell className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            Notifications
          </h2>
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-[#222222]/50">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Push Notifications</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Receive instant alerts on your desktop or mobile device
            </p>
          </div>
          <button
            onClick={() => setPushNotifications(!pushNotifications)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              pushNotifications ? 'bg-red-500 justify-end' : 'bg-zinc-300 dark:bg-[#222222] justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Recommendations */}
        <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-[#222222]/50">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">New Music Recommendations</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Get notified when artists you follow release new tracks
            </p>
          </div>
          <button
            onClick={() => setRecommendations(!recommendations)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              recommendations ? 'bg-red-500 justify-end' : 'bg-zinc-300 dark:bg-[#222222] justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Playlist Updates */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Playlist Updates</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Notify me when collaborator adds songs to shared playlists
            </p>
          </div>
          <button
            onClick={() => setPlaylistUpdates(!playlistUpdates)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              playlistUpdates ? 'bg-red-500 justify-end' : 'bg-zinc-300 dark:bg-[#222222] justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>
      </section>

      {/* 4. Account Section */}
      <section className="bg-white dark:bg-[#0A0A0A] rounded-3xl p-6 border border-black/5 dark:border-[#222222] shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-[#222222]">
          <User className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            Account
          </h2>
        </div>

        {isAuthenticated && user ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-[#111111] border border-black/5 dark:border-[#222222]">
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-red-500 text-white font-black text-base flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-white text-base">{user.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-1 text-xs font-bold text-red-500 hover:underline"
              >
                View Profile <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                  addToast('Logged out successfully', 'info');
                }}
                className="px-5 py-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-extrabold text-xs flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Account Session</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">You are currently listening as a guest</p>
            </div>
            <Link
              to="/login"
              className="px-5 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs shadow-md shadow-red-500/20"
            >
              Log In
            </Link>
          </div>
        )}
      </section>

      {/* 5. About Section */}
      <section className="bg-white dark:bg-[#0A0A0A] rounded-3xl p-6 border border-black/5 dark:border-[#222222] shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-[#222222]">
          <Info className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            About VibeFlow
          </h2>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-[#222222]/50 text-xs">
          <span className="font-bold text-slate-900 dark:text-white">App Version</span>
          <span className="text-zinc-500 dark:text-zinc-400 font-mono font-semibold">v1.0.0 (High Fidelity Edition)</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-[#222222]/50 text-xs">
          <button
            onClick={() => setModalType('privacy')}
            className="font-bold text-slate-900 dark:text-white hover:text-red-500 flex items-center gap-2"
          >
            <Lock className="w-4 h-4 text-zinc-400" /> Privacy Policy
          </button>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </div>

        <div className="flex items-center justify-between py-2 text-xs">
          <button
            onClick={() => setModalType('terms')}
            className="font-bold text-slate-900 dark:text-white hover:text-red-500 flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-zinc-400" /> Terms of Service
          </button>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </div>
      </section>

      {/* Privacy / Terms Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-[#222222] rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-xl font-black text-slate-900 dark:text-white capitalize">
              VibeFlow {modalType === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            </h3>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-h-60 overflow-y-auto pr-2 space-y-2">
              <p>
                Welcome to VibeFlow. We respect your audio privacy and ensure that all your music streams, preferences, and personal playlists remain private.
              </p>
              <p>
                By using VibeFlow, you agree to fair use streaming policies and Jamendo Creative Commons licensing terms where applicable.
              </p>
            </div>
            <button
              onClick={() => setModalType(null)}
              className="mt-2 w-full py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
