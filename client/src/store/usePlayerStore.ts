import { create } from 'zustand';
import { Track, RepeatMode } from '../types';
import { trackService } from '../services/trackService';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: Track[];
  queueIndex: number;
  shuffle: boolean;
  repeat: RepeatMode;
  isQueueOpen: boolean;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setIsQueueOpen: (open: boolean) => void;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleLikeCurrentTrack: () => Promise<void>;
}

// Global Audio Singleton
let audio: HTMLAudioElement | null = null;
let playLoggedTrackId: string | null = null;
let playLogTimer: any = null;

if (typeof window !== 'undefined') {
  audio = new Audio();
  audio.preload = 'metadata';
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Setup audio listeners once
  if (audio) {
    audio.addEventListener('timeupdate', () => {
      set({ currentTime: audio?.currentTime || 0 });
    });

    audio.addEventListener('loadedmetadata', () => {
      if (audio && audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        set({ duration: audio.duration });
      }
    });

    audio.addEventListener('ended', () => {
      const { repeat, nextTrack } = get();
      if (repeat === 'one') {
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
      } else {
        nextTrack();
      }
    });

    audio.addEventListener('play', () => {
      set({ isPlaying: true });
    });

    audio.addEventListener('pause', () => {
      set({ isPlaying: false });
    });

    audio.addEventListener('error', (e) => {
      console.warn('Audio playback error:', e);
      set({ isPlaying: false });
    });
  }

  const updateMediaSession = (track: Track) => {
    if ('mediaSession' in navigator && track) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist?.name || 'VibeFlow Artist',
        album: track.album?.title || 'VibeFlow',
        artwork: track.coverUrl
          ? [{ src: track.coverUrl, sizes: '512x512', type: 'image/svg+xml' }]
          : [],
      });

      navigator.mediaSession.setActionHandler('play', () => get().togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => get().togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => get().prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => get().nextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) get().seekTo(details.seekTime);
      });
    }
  };

  const schedulePlayLog = (track: Track) => {
    if (playLogTimer) clearTimeout(playLogTimer);
    playLoggedTrackId = track.id;

    playLogTimer = setTimeout(() => {
      if (playLoggedTrackId === track.id) {
        trackService.recordPlay(track.id).catch(() => {});
      }
    }, 4000);
  };

  return {
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    queue: [],
    queueIndex: 0,
    shuffle: false,
    repeat: 'off',
    isQueueOpen: false,

    playTrack: (track: Track, newQueue?: Track[]) => {
      if (!audio) return;

      const currentQueue = newQueue || get().queue;
      let finalQueue = currentQueue.length > 0 ? currentQueue : [track];
      let index = finalQueue.findIndex((t) => t.id === track.id);

      if (index === -1) {
        finalQueue = [...finalQueue, track];
        index = finalQueue.length - 1;
      }

      set({
        currentTrack: track,
        queue: finalQueue,
        queueIndex: index,
        currentTime: 0,
        duration: track.duration || 0,
      });

      audio.src = track.audioUrl;
      audio.volume = get().isMuted ? 0 : get().volume;
      audio
        .play()
        .then(() => {
          set({ isPlaying: true });
          updateMediaSession(track);
          schedulePlayLog(track);
        })
        .catch((err) => {
          console.warn('Playback initiation error:', err);
          set({ isPlaying: false });
        });
    },

    playQueue: (tracks: Track[], startIndex: number = 0) => {
      if (!tracks || tracks.length === 0) return;
      const validIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
      const targetTrack = tracks[validIndex];
      get().playTrack(targetTrack, tracks);
    },

    togglePlay: () => {
      if (!audio) return;
      const { currentTrack, isPlaying, queue } = get();

      if (!currentTrack && queue.length > 0) {
        get().playTrack(queue[0]);
        return;
      }

      if (isPlaying) {
        audio.pause();
        set({ isPlaying: false });
      } else {
        if (audio.src) {
          audio
            .play()
            .then(() => set({ isPlaying: true }))
            .catch(() => set({ isPlaying: false }));
        } else if (currentTrack) {
          get().playTrack(currentTrack);
        }
      }
    },

    nextTrack: () => {
      const { queue, queueIndex, shuffle, repeat, playTrack } = get();
      if (queue.length === 0) return;

      if (shuffle) {
        const randomIndex = Math.floor(Math.random() * queue.length);
        playTrack(queue[randomIndex]);
        return;
      }

      const nextIndex = queueIndex + 1;
      if (nextIndex < queue.length) {
        playTrack(queue[nextIndex]);
      } else if (repeat === 'all') {
        playTrack(queue[0]);
      } else {
        set({ isPlaying: false });
      }
    },

    prevTrack: () => {
      if (!audio) return;
      const { queue, queueIndex, playTrack, currentTime } = get();

      // If more than 3 seconds in, restart current track
      if (currentTime > 3) {
        audio.currentTime = 0;
        set({ currentTime: 0 });
        return;
      }

      if (queue.length === 0) return;
      const prevIndex = queueIndex - 1;
      if (prevIndex >= 0) {
        playTrack(queue[prevIndex]);
      } else {
        audio.currentTime = 0;
        set({ currentTime: 0 });
      }
    },

    seekTo: (time: number) => {
      if (!audio) return;
      const validTime = Math.max(0, Math.min(time, get().duration || 1000));
      audio.currentTime = validTime;
      set({ currentTime: validTime });
    },

    setVolume: (vol: number) => {
      if (!audio) return;
      const clamped = Math.max(0, Math.min(1, vol));
      audio.volume = clamped;
      set({ volume: clamped, isMuted: clamped === 0 });
    },

    toggleMute: () => {
      if (!audio) return;
      const { isMuted, volume } = get();
      if (isMuted) {
        audio.volume = volume || 0.8;
        set({ isMuted: false });
      } else {
        audio.volume = 0;
        set({ isMuted: true });
      }
    },

    toggleShuffle: () => {
      set((state) => ({ shuffle: !state.shuffle }));
    },

    toggleRepeat: () => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const nextMode = modes[(modes.indexOf(get().repeat) + 1) % modes.length];
      set({ repeat: nextMode });
    },

    setIsQueueOpen: (open: boolean) => {
      set({ isQueueOpen: open });
    },

    addToQueue: (track: Track) => {
      set((state) => ({
        queue: [...state.queue, track],
      }));
    },

    playNext: (track: Track) => {
      const { queue, queueIndex } = get();
      const updated = [...queue];
      updated.splice(queueIndex + 1, 0, track);
      set({ queue: updated });
    },

    removeFromQueue: (index: number) => {
      const { queue, queueIndex } = get();
      const updated = queue.filter((_, i) => i !== index);
      let newIndex = queueIndex;
      if (index < queueIndex) newIndex--;
      set({ queue: updated, queueIndex: newIndex });
    },

    clearQueue: () => {
      const { currentTrack } = get();
      set({
        queue: currentTrack ? [currentTrack] : [],
        queueIndex: 0,
      });
    },

    toggleLikeCurrentTrack: async () => {
      const { currentTrack } = get();
      if (!currentTrack) return;

      const nextLiked = !currentTrack.isLiked;
      set({
        currentTrack: { ...currentTrack, isLiked: nextLiked },
        queue: get().queue.map((t) => (t.id === currentTrack.id ? { ...t, isLiked: nextLiked } : t)),
      });

      try {
        if (nextLiked) {
          await trackService.likeTrack(currentTrack.id, currentTrack);
        } else {
          await trackService.unlikeTrack(currentTrack.id);
        }
      } catch (err) {
        // Revert on error
        set({
          currentTrack: { ...currentTrack, isLiked: !nextLiked },
          queue: get().queue.map((t) => (t.id === currentTrack.id ? { ...t, isLiked: !nextLiked } : t)),
        });
      }
    },
  };
});
