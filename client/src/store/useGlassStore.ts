import { create } from 'zustand';
import { useThemeStore } from './useThemeStore';

export type GlassPreset = 'subtle' | 'balanced' | 'liquid' | 'ultra' | 'custom';

export interface GlassSettings {
  preset: GlassPreset;
  glassIntensity: number; // 0 - 100 (%)
  blurStrength: number; // 0 - 40 (px)
  transparency: number; // 10 - 90 (%)
  showReflections: boolean; // boolean
  showBorders: boolean; // boolean
  reduceAnimations: boolean; // boolean
}

export const GLASS_PRESETS: Record<Exclude<GlassPreset, 'custom'>, GlassSettings> = {
  subtle: {
    preset: 'subtle',
    glassIntensity: 35,
    blurStrength: 10,
    transparency: 30,
    showReflections: false,
    showBorders: true,
    reduceAnimations: false,
  },
  balanced: {
    preset: 'balanced',
    glassIntensity: 65,
    blurStrength: 18,
    transparency: 55,
    showReflections: true,
    showBorders: true,
    reduceAnimations: false,
  },
  liquid: {
    preset: 'liquid',
    glassIntensity: 85,
    blurStrength: 28,
    transparency: 70,
    showReflections: true,
    showBorders: true,
    reduceAnimations: false,
  },
  ultra: {
    preset: 'ultra',
    glassIntensity: 100,
    blurStrength: 38,
    transparency: 85,
    showReflections: true,
    showBorders: true,
    reduceAnimations: false,
  },
};

export const DEFAULT_GLASS_SETTINGS: GlassSettings = GLASS_PRESETS.liquid;

const STORAGE_KEY = 'vibeflow-glass-settings';

const getInitialOSReducedMotion = (): boolean => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
};

const getStoredGlassSettings = (): GlassSettings => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_GLASS_SETTINGS,
          ...parsed,
          reduceAnimations: parsed.reduceAnimations ?? getInitialOSReducedMotion(),
        };
      }
    } catch (e) {
      console.warn('Failed to load glass settings from localStorage:', e);
    }
  }
  return {
    ...DEFAULT_GLASS_SETTINGS,
    reduceAnimations: getInitialOSReducedMotion(),
  };
};

export const applyGlassToDOM = (settings: GlassSettings, effectiveTheme: 'dark' | 'light') => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const isDark = effectiveTheme === 'dark';

  const {
    glassIntensity,
    blurStrength,
    transparency,
    showReflections,
    showBorders,
    reduceAnimations,
  } = settings;

  const normTrans = transparency / 100;
  const intensityFactor = glassIntensity / 100;

  // Compute translucent alphas
  const surfaceAlpha = isDark
    ? Math.max(0.20, 0.96 - normTrans * 0.65)
    : Math.max(0.25, 0.98 - normTrans * 0.60);

  const cardAlpha = isDark
    ? Math.max(0.14, surfaceAlpha - 0.08)
    : Math.max(0.20, surfaceAlpha - 0.06);

  const cardHoverAlpha = isDark
    ? Math.min(0.92, cardAlpha + 0.16)
    : Math.min(0.96, cardAlpha + 0.18);

  const chromeAlpha = isDark
    ? Math.max(0.26, surfaceAlpha + 0.06)
    : Math.max(0.35, surfaceAlpha + 0.06);

  // Border calculations
  const borderAlpha = showBorders
    ? (isDark ? (0.04 + intensityFactor * 0.14) : (0.25 + intensityFactor * 0.55))
    : 0;

  const borderColor = `rgba(255, 255, 255, ${borderAlpha.toFixed(3)})`;

  // Specular reflection calculations
  const specularOpacity = showReflections ? (0.15 + intensityFactor * 0.8).toFixed(2) : '0';
  const specularColor = isDark
    ? `rgba(255, 255, 255, ${(0.08 + intensityFactor * 0.18).toFixed(3)})`
    : `rgba(255, 255, 255, ${(0.35 + intensityFactor * 0.6).toFixed(3)})`;

  // Material background colors
  const surfaceBg = isDark
    ? `rgba(13, 14, 22, ${surfaceAlpha.toFixed(3)})`
    : `rgba(255, 255, 255, ${surfaceAlpha.toFixed(3)})`;

  const cardBg = isDark
    ? `rgba(18, 20, 30, ${cardAlpha.toFixed(3)})`
    : `rgba(255, 255, 255, ${cardAlpha.toFixed(3)})`;

  const cardHoverBg = isDark
    ? `rgba(28, 31, 46, ${cardHoverAlpha.toFixed(3)})`
    : `rgba(255, 255, 255, ${cardHoverAlpha.toFixed(3)})`;

  const playerBg = isDark
    ? `rgba(12, 13, 20, ${chromeAlpha.toFixed(3)})`
    : `rgba(255, 255, 255, ${chromeAlpha.toFixed(3)})`;

  const navBg = isDark
    ? `rgba(10, 11, 18, ${chromeAlpha.toFixed(3)})`
    : `rgba(255, 255, 255, ${chromeAlpha.toFixed(3)})`;

  const saturation = Math.round(130 + intensityFactor * 70);
  const blurPx = `${blurStrength}px`;

  // Apply to root style
  root.style.setProperty('--glass-blur', blurPx);
  root.style.setProperty('--glass-saturation', `${saturation}%`);
  root.style.setProperty('--glass-surface-bg', surfaceBg);
  root.style.setProperty('--glass-card-bg', cardBg);
  root.style.setProperty('--glass-card-hover', cardHoverBg);
  root.style.setProperty('--glass-player-bg', playerBg);
  root.style.setProperty('--glass-nav-bg', navBg);
  root.style.setProperty('--glass-border-color', borderColor);
  root.style.setProperty('--glass-specular-opacity', specularOpacity);
  root.style.setProperty('--glass-specular-color', specularColor);

  // Reduced motion toggling
  if (reduceAnimations) {
    root.classList.add('reduce-motion');
    root.style.setProperty('--app-transition-duration', '0.001s');
  } else {
    root.classList.remove('reduce-motion');
    root.style.setProperty('--app-transition-duration', '0.22s');
  }
};

interface GlassStoreState {
  settings: GlassSettings;
  setSetting: <K extends keyof GlassSettings>(key: K, value: GlassSettings[K]) => void;
  setPreset: (preset: Exclude<GlassPreset, 'custom'>) => void;
  resetToDefault: () => void;
}

const initialSettings = getStoredGlassSettings();
// Synchronously apply on initial module execution
if (typeof window !== 'undefined') {
  const currentTheme = useThemeStore.getState().effectiveTheme || 'dark';
  applyGlassToDOM(initialSettings, currentTheme);

  // Subscribe to theme updates to reapply glass variables with accurate light/dark colors
  useThemeStore.subscribe((themeState) => {
    const currentSettings = useGlassStore ? useGlassStore.getState().settings : initialSettings;
    applyGlassToDOM(currentSettings, themeState.effectiveTheme);
  });
}

export const useGlassStore = create<GlassStoreState>((set, get) => ({
  settings: initialSettings,

  setSetting: (key, value) => {
    const current = get().settings;
    const updated = {
      ...current,
      [key]: value,
      // If manually adjusting a slider/toggle, set preset to 'custom' unless matching a preset
      preset: key === 'preset' ? (value as GlassPreset) : 'custom',
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save glass settings:', e);
      }
    }

    const currentTheme = useThemeStore.getState().effectiveTheme;
    applyGlassToDOM(updated, currentTheme);

    set({ settings: updated });
  },

  setPreset: (presetKey) => {
    const presetSettings = GLASS_PRESETS[presetKey];
    if (!presetSettings) return;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presetSettings));
      } catch (e) {
        console.warn('Failed to save glass preset:', e);
      }
    }

    const currentTheme = useThemeStore.getState().effectiveTheme;
    applyGlassToDOM(presetSettings, currentTheme);

    set({ settings: presetSettings });
  },

  resetToDefault: () => {
    const defaultSettings: GlassSettings = {
      ...DEFAULT_GLASS_SETTINGS,
      reduceAnimations: getInitialOSReducedMotion(),
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
      } catch (e) {
        console.warn('Failed to reset glass settings:', e);
      }
    }

    const currentTheme = useThemeStore.getState().effectiveTheme;
    applyGlassToDOM(defaultSettings, currentTheme);

    set({ settings: defaultSettings });
  },
}));
