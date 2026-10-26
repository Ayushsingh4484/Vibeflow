import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useThemeStore, ThemePreference } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { useGlassStore, GlassPreset } from '../store/useGlassStore';
import {
  Sun,
  Moon,
  Laptop,
  Sliders,
  Bell,
  User,
  Info,
  LogOut,
  ChevronRight,
  Sparkles,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  Play,
  Heart,
  FileText,
  Lock,
  Volume2,
  Check,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { themePreference, setThemePreference, effectiveTheme } = useThemeStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const { settings, setSetting, setPreset, resetToDefault } = useGlassStore();
  const navigate = useNavigate();

  // Local state for UI controls without backend pretend
  const [autoplay, setAutoplay] = useState(true);
  const [crossfade, setCrossfade] = useState(0);
  const [audioQuality, setAudioQuality] = useState<'normal' | 'high' | 'very_high'>('high');

  const [pushNotifications, setPushNotifications] = useState(true);
  const [recommendations, setRecommendations] = useState(true);
  const [playlistUpdates, setPlaylistUpdates] = useState(false);

  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewLiked, setPreviewLiked] = useState(true);

  const themeOptions: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
    { value: 'system', label: 'System', icon: <Laptop className="w-4 h-4" /> },
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
  ];

  const presetList: { id: Exclude<GlassPreset, 'custom'>; label: string; desc: string }[] = [
    { id: 'subtle', label: 'Subtle', desc: 'Light blur (10px), high opacity' },
    { id: 'balanced', label: 'Balanced', desc: 'Medium blur (18px), soft highlights' },
    { id: 'liquid', label: 'Liquid Glass', desc: 'Vivid blur (28px), rich refractions' },
    { id: 'ultra', label: 'Ultra Glass', desc: 'Deep blur (38px), maximum transparency' },
  ];

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-red-500/15 text-red-500 border border-red-500/25">
            Liquid Glass Experience
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
          Settings & Customization
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Fine-tune the Liquid Glass translucent shaders, audio preferences, notifications, and account credentials.
        </p>
      </div>

      {/* 1. Dedicated Appearance & Glass Effects Section */}
      <section className="liquid-glass-card rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col gap-6 shadow-xl">
        <div className="liquid-specular-top" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Appearance & Glass Effects
                {settings.preset === 'custom' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/25">
                    Custom Tuning
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/25 capitalize">
                    {settings.preset} Preset
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Configure real-time liquid transparency, specular edge lighting, and depth blur.
              </p>
            </div>
          </div>

          {/* Reset to Default Button */}
          <button
            onClick={() => {
              resetToDefault();
              addToast('Glass effects reset to Liquid Glass defaults', 'info');
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/10 transition-all active:scale-95 self-start sm:self-auto"
            title="Reset glass parameters to original default"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-500" />
            <span>Reset to default</span>
          </button>
        </div>

        {/* LIVE GLASS PREVIEW PANEL */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-red-500" /> Live Glass Shader Preview
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              Blur: {settings.blurStrength}px • Trans: {settings.transparency}%
            </span>
          </div>

          {/* Interactive Preview Container with Dynamic Ambient Orbs */}
          <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-slate-950 flex items-center justify-center min-h-[200px]">
            {/* Ambient Background Light Elements that show through the glass */}
            <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-red-600/40 blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-purple-600/35 blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full bg-cyan-500/25 blur-2xl pointer-events-none" />

            {/* Pattern grid overlay to demonstrate refraction */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
                backgroundSize: '20px 20px',
              }}
            />

            {/* The Floating Glass Card (uses current live CSS variables) */}
            <div className="relative z-10 w-full max-w-md liquid-glass-card rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 border border-white/15">
              <div className="liquid-specular-top" />

              <div className="flex items-center gap-4">
                {/* Album Art with Glass Glare */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shadow-lg flex-shrink-0 group">
                  <img
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80"
                    alt="Liquid Dreams Preview"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/20" />
                  <div className="liquid-specular-top" />
                </div>

                {/* Track Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                      Now Streaming
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Lossless Audio</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-white truncate tracking-tight mt-0.5">
                    Liquid Reflections
                  </h4>
                  <p className="text-xs text-zinc-300 truncate">VibeFlow Soundscapes • Chillout</p>
                </div>

                {/* Like Button */}
                <button
                  onClick={() => setPreviewLiked(!previewLiked)}
                  className={`p-2 rounded-full transition-all active:scale-90 ${
                    previewLiked ? 'text-red-500 bg-red-500/15' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${previewLiked ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Progress Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full w-2/3 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md" />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>2:14</span>
                  <span>3:45</span>
                </div>
              </div>

              {/* Live Status Indicators */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-300">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewPlaying(!previewPlaying)}
                    className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md shadow-red-500/30"
                  >
                    {previewPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />}
                  </button>
                  <span className="font-semibold text-white">Live Shader Rendering</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                  <span>Intensity: {settings.glassIntensity}%</span>
                  <span>•</span>
                  <span>Borders: {settings.showBorders ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRESET SELECTOR */}
        <div className="flex flex-col gap-3 pt-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-red-500" /> Choose a Glass Preset
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {presetList.map((preset) => {
              const isActive = settings.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setPreset(preset.id);
                    addToast(`Switched to "${preset.label}" glass preset`, 'success');
                  }}
                  className={`p-3.5 rounded-2xl text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isActive
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/25 ring-2 ring-red-400/50 scale-[1.02]'
                      : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-xs tracking-tight">{preset.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span
                    className={`text-[10px] leading-snug line-clamp-2 ${
                      isActive ? 'text-white/80' : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {preset.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* DETAILED SLIDERS & TOGGLES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Left Column: Sliders */}
          <div className="flex flex-col gap-5 p-4 rounded-2xl bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Dimensional Sliders
            </h3>

            {/* Glass Intensity: 0% to 100% */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Glass Intensity</span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Surface color vibrancy & saturation</p>
                </div>
                <span className="text-xs font-bold text-red-500 font-mono tabular-nums px-2 py-0.5 rounded-lg bg-red-500/10">
                  {settings.glassIntensity}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.glassIntensity}
                onChange={(e) => setSetting('glassIntensity', parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-200 dark:bg-white/10 rounded-full accent-red-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>0% (Soft)</span>
                <span>50%</span>
                <span>100% (Maximum Vibrancy)</span>
              </div>
            </div>

            {/* Background Blur: 0px to 40px */}
            <div className="flex flex-col gap-2 pt-1 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Background Blur</span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Backdrop filter diffusion radius</p>
                </div>
                <span className="text-xs font-bold text-red-500 font-mono tabular-nums px-2 py-0.5 rounded-lg bg-red-500/10">
                  {settings.blurStrength}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={settings.blurStrength}
                onChange={(e) => setSetting('blurStrength', parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-200 dark:bg-white/10 rounded-full accent-red-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>0px (Crisp)</span>
                <span>20px</span>
                <span>40px (Ultra Diffusion)</span>
              </div>
            </div>

            {/* Glass Transparency: 10% to 90% */}
            <div className="flex flex-col gap-2 pt-1 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Glass Transparency</span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">How much background content shows through</p>
                </div>
                <span className="text-xs font-bold text-red-500 font-mono tabular-nums px-2 py-0.5 rounded-lg bg-red-500/10">
                  {settings.transparency}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                value={settings.transparency}
                onChange={(e) => setSetting('transparency', parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-200 dark:bg-white/10 rounded-full accent-red-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>10% (Dense)</span>
                <span>50%</span>
                <span>90% (Near Transparent)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Toggles */}
          <div className="flex flex-col gap-4 p-4 rounded-2xl bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                Surface & Motion Toggles
              </h3>

              {/* Reflections and Highlights Toggle */}
              <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/5">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Reflections & Highlights</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Top specular edge refraction lines and inner bevel gleam
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSetting('showReflections', !settings.showReflections)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors flex-shrink-0 ${
                    settings.showReflections ? 'bg-red-500 justify-end' : 'bg-zinc-300 dark:bg-white/20 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Glass Borders Toggle */}
              <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/5">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Glass Borders</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Luminous translucent boundary borders on panels & cards
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSetting('showBorders', !settings.showBorders)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors flex-shrink-0 ${
                    settings.showBorders ? 'bg-red-500 justify-end' : 'bg-zinc-300 dark:bg-white/20 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Reduce Animations Toggle */}
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Reduce Animations</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Disable scale shifts & blur transitions (Respects OS setting)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSetting('reduceAnimations', !settings.reduceAnimations)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors flex-shrink-0 ${
                    settings.reduceAnimations ? 'bg-red-500 justify-end' : 'bg-zinc-300 dark:bg-white/20 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>

            {/* Quick summary note */}
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed border border-black/5 dark:border-white/5">
              Settings are saved automatically to your browser storage and dynamically update every sidebar, player, navigation bar, and music card instantly.
            </div>
          </div>
        </div>
      </section>

      {/* 2. Theme Preference Section */}
      <section className="liquid-glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col gap-4 shadow-lg">
        <div className="liquid-specular-top" />

        <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/10">
          <Sun className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Base Theme Mode
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Light / Dark Palette</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Currently active: <span className="capitalize font-semibold text-red-500">{effectiveTheme} Mode</span> ({themePreference})
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1.5 rounded-full border border-black/5 dark:border-white/10">
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

      {/* 3. Playback Section */}
      <section className="liquid-glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col gap-4 shadow-lg">
        <div className="liquid-specular-top" />

        <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/10">
          <Sliders className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Playback Preferences
          </h2>
        </div>

        {/* Autoplay Toggle */}
        <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-white/5">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Autoplay</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Keep listening to similar songs when your music ends
            </p>
          </div>
          <button
            onClick={() => setAutoplay(!autoplay)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              autoplay ? 'bg-red-500 justify-end' : 'bg-zinc-300 dark:bg-white/20 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Crossfade Slider */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-black/5 dark:border-white/5">
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
              className="w-full h-1.5 bg-zinc-200 dark:bg-white/10 rounded-full accent-red-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums w-8 text-right font-mono">
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
            className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-3.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="normal" className="bg-slate-900 text-white">Normal (96 kbps)</option>
            <option value="high" className="bg-slate-900 text-white">High (160 kbps)</option>
            <option value="very_high" className="bg-slate-900 text-white">Very High (320 kbps Lossless)</option>
          </select>
        </div>
      </section>

      {/* 4. Notifications Section */}
      <section className="liquid-glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col gap-4 shadow-lg">
        <div className="liquid-specular-top" />

        <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/10">
          <Bell className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Notifications
          </h2>
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-white/5">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Push Notifications</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Receive instant alerts on your desktop or mobile device
            </p>
          </div>
          <button
            onClick={() => setPushNotifications(!pushNotifications)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              pushNotifications ? 'bg-red-500 justify-end' : 'bg-zinc-300 dark:bg-white/20 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Recommendations */}
        <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-white/5">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">New Music Recommendations</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Get notified when artists you follow release new tracks
            </p>
          </div>
          <button
            onClick={() => setRecommendations(!recommendations)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              recommendations ? 'bg-red-500 justify-end' : 'bg-zinc-300 dark:bg-white/20 justify-start'
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
              playlistUpdates ? 'bg-red-500 justify-end' : 'bg-zinc-300 dark:bg-white/20 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>
      </section>

      {/* 5. Account Section */}
      <section className="liquid-glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col gap-4 shadow-lg">
        <div className="liquid-specular-top" />

        <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/10">
          <User className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Account Details
          </h2>
        </div>

        {isAuthenticated && user ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-red-500/20" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-red-500 text-white font-black text-base flex items-center justify-center shadow-md shadow-red-500/30">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-base">{user.name}</p>
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
                className="px-5 py-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-extrabold text-xs flex items-center gap-2 transition-colors border border-rose-500/20"
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
              className="px-5 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs shadow-md shadow-red-500/20 active:scale-95 transition-all"
            >
              Log In
            </Link>
          </div>
        )}
      </section>

      {/* 6. About Section */}
      <section className="liquid-glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col gap-4 shadow-lg">
        <div className="liquid-specular-top" />

        <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/10">
          <Info className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            About VibeFlow
          </h2>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-white/5 text-xs">
          <span className="font-bold text-slate-900 dark:text-white">App Version</span>
          <span className="text-zinc-500 dark:text-zinc-400 font-mono font-semibold">v1.2.0 (Liquid Glass Edition)</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-white/5 text-xs">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="liquid-glass rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 border border-white/20 relative overflow-hidden">
            <div className="liquid-specular-top" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white capitalize">
              VibeFlow {modalType === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            </h3>
            <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed max-h-60 overflow-y-auto pr-2 space-y-2">
              <p>
                Welcome to VibeFlow. We respect your audio privacy and ensure that all your music streams, preferences, and personal playlists remain private.
              </p>
              <p>
                By using VibeFlow, you agree to fair use streaming policies and Jamendo Creative Commons licensing terms where applicable.
              </p>
            </div>
            <button
              onClick={() => setModalType(null)}
              className="mt-2 w-full py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs shadow-md shadow-red-500/25 active:scale-95 transition-transform"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
