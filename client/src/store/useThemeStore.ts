import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

interface ThemeState {
  themePreference: ThemePreference;
  effectiveTheme: EffectiveTheme;
  setThemePreference: (pref: ThemePreference) => void;
}

const getStoredPreference = (): ThemePreference => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('vibeflow-theme-pref') as ThemePreference | null;
    if (saved === 'system' || saved === 'light' || saved === 'dark') {
      return saved;
    }
  }
  return 'system';
};

const getSystemTheme = (): EffectiveTheme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

const resolveEffectiveTheme = (pref: ThemePreference): EffectiveTheme => {
  if (pref === 'system') {
    return getSystemTheme();
  }
  return pref;
};

const applyDOMTheme = (effective: EffectiveTheme) => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  if (effective === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
};

const initialPref = getStoredPreference();
const initialEffective = resolveEffectiveTheme(initialPref);
applyDOMTheme(initialEffective);

export const useThemeStore = create<ThemeState>((set, get) => {
  // Listen to OS system color scheme changes dynamically
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const currentPref = get().themePreference;
      if (currentPref === 'system') {
        const newEffective = getSystemTheme();
        applyDOMTheme(newEffective);
        set({ effectiveTheme: newEffective });
      }
    };
    try {
      mediaQuery.addEventListener('change', handleSystemChange);
    } catch {
      mediaQuery.addListener(handleSystemChange);
    }
  }

  return {
    themePreference: initialPref,
    effectiveTheme: initialEffective,
    setThemePreference: (pref: ThemePreference) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('vibeflow-theme-pref', pref);
      }
      const newEffective = resolveEffectiveTheme(pref);
      applyDOMTheme(newEffective);
      set({
        themePreference: pref,
        effectiveTheme: newEffective,
      });
    },
  };
});
