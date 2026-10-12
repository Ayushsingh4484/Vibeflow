import { create } from 'zustand';
import { Track, RepeatMode } from '../types';
import { trackService } from '../services/trackService';
import { youtubeBridge } from '../services/youtubePlayer';

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
  isNowPlayingOpen: boolean;

  // Actions
  setIsNowPlayingOpen: (open: boolean) => void;
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

// Global Audio Singleton for Local / Jamendo MP3 files
let audio: HTMLAudioElement | null = null;
let playLoggedTrackId: string | null = null;
let playLogTimer: any = null;

if (typeof window !== 'undefined') {
  audio = new Audio();
  audio.preload = 'metadata';
}

function extractYouTubeId(track: Track): string | null {
  if (track.youtubeId) return track.youtubeId;
  if (track.id.startsWith('yt-')) return track.id.replace(/^yt-/, '');
  if (track.audioUrl) {
    const match = track.audioUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  }
  return null;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Setup HTML5 Audio listeners
  if (audio) {
    audio.addEventListener('timeupdate', () => {
      const { currentTrack } = get();
      if (!currentTrack || currentTrack.source !== 'youtube') {
        set({ currentTime: audio?.currentTime || 0 });
      }
    });

    audio.addEventListener('loadedmetadata', () => {
      const { currentTrack } = get();
      if (!currentTrack || currentTrack.source !== 'youtube') {
        if (audio && audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
          set({ duration: audio.duration });
        }
      }
    });

    audio.addEventListener('ended', () => {
      const { currentTrack, repeat, nextTrack } = get();
      if (currentTrack?.source === 'youtube') return;

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
      const { currentTrack } = get();
      if (!currentTrack || currentTrack.source !== 'youtube') {
        set({ isPlaying: true });
      }
    });

    audio.addEventListener('pause', () => {
      const { currentTrack } = get();
      if (!currentTrack || currentTrack.source !== 'youtube') {
        set({ isPlaying: false });
      }
    });

    audio.addEventListener('error', (e) => {
      const { currentTrack } = get();
      if (currentTrack?.source !== 'youtube') {
        console.warn('Audio playback error:', e);
        set({ isPlaying: false });
      }
    });
  }

  // Setup YouTube Bridge listeners
  if (typeof window !== 'undefined') {
    youtubeBridge.onTimeUpdate = (current, total) => {
      const { currentTrack } = get();
      if (currentTrack?.source === 'youtube') {
        set({
          currentTime: current,
          ...(total > 0 ? { duration: total } : {}),
        });
      }
    };

    youtubeBridge.onStateChange = (isPlaying) => {
      const { currentTrack } = get();
      if (currentTrack?.source === 'youtube') {
        set({ isPlaying });
      }
    };

    youtubeBridge.onEnded = () => {
      const { currentTrack, repeat, nextTrack } = get();
      if (currentTrack?.source !== 'youtube') return;

      if (repeat === 'one') {
        const ytId = extractYouTubeId(currentTrack);
        if (ytId) youtubeBridge.playVideo(ytId, get().isMuted ? 0 : get().volume);
      } else {
        nextTrack();
      }
    };
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
    isNowPlayingOpen: false,

    setIsNowPlayingOpen: (open: boolean) => {
      set({ isNowPlayingOpen: open });
    },

    playTrack: (track: Track, newQueue?: Track[]) => {
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

      updateMediaSession(track);
      schedulePlayLog(track);

      const ytId = extractYouTubeId(track);
      const isYt = track.source === 'youtube' || !!ytId;

      if (isYt && ytId) {
        // Stop standard HTML5 audio
        if (audio) {
          audio.pause();
          audio.src = '';
        }

        // Play via YouTube Bridge
        const activeVol = get().isMuted ? 0 : get().volume;
        youtubeBridge.playVideo(ytId, activeVol).then(() => {
          set({ isPlaying: true });
        }).catch((err) => {
          console.warn('[YouTube] playback initiation failed:', err);
          set({ isPlaying: false });
        });
      } else {
        // Stop YouTube player if playing
        youtubeBridge.stop();

        if (!audio) return;
        audio.src = track.audioUrl;
        audio.volume = get().isMuted ? 0 : get().volume;
        audio
          .play()
          .then(() => {
            set({ isPlaying: true });
          })
          .catch((err) => {
            console.warn('Playback initiation error:', err);
            set({ isPlaying: false });
          });
      }
    },

    playQueue: (tracks: Track[], startIndex: number = 0) => {
      if (!tracks || tracks.length === 0) return;
      const validIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
      const targetTrack = tracks[validIndex];
      get().playTrack(targetTrack, tracks);
    },

    togglePlay: () => {
      const { currentTrack, isPlaying, queue } = get();

      if (!currentTrack && queue.length > 0) {
        get().playTrack(queue[0]);
        return;
      }

      if (!currentTrack) return;

      const ytId = extractYouTubeId(currentTrack);
      const isYt = currentTrack.source === 'youtube' || !!ytId;

      if (isYt) {
        if (isPlaying) {
          youtubeBridge.pause();
          set({ isPlaying: false });
        } else {
          youtubeBridge.play();
          set({ isPlaying: true });
        }
        return;
      }

      if (!audio) return;
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
        const { currentTrack } = get();
        if (currentTrack?.source === 'youtube') youtubeBridge.stop();
        if (audio) audio.pause();
        set({ isPlaying: false });
      }
    },

    prevTrack: () => {
      const { queue, queueIndex, playTrack, currentTime, currentTrack } = get();

      if (currentTime > 3) {
        if (currentTrack?.source === 'youtube') {
          youtubeBridge.seekTo(0);
        } else if (audio) {
          audio.currentTime = 0;
        }
        set({ currentTime: 0 });
        return;
      }

      if (queue.length === 0) return;
      const prevIndex = queueIndex - 1;
      if (prevIndex >= 0) {
        playTrack(queue[prevIndex]);
      } else {
        if (currentTrack?.source === 'youtube') {
          youtubeBridge.seekTo(0);
        } else if (audio) {
          audio.currentTime = 0;
        }
        set({ currentTime: 0 });
      }
    },

    seekTo: (time: number) => {
      const { currentTrack, duration } = get();
      const validTime = Math.max(0, Math.min(time, duration || 1000));

      if (currentTrack?.source === 'youtube') {
        youtubeBridge.seekTo(validTime);
      } else if (audio) {
        audio.currentTime = validTime;
      }
      set({ currentTime: validTime });
    },

    setVolume: (vol: number) => {
      const clamped = Math.max(0, Math.min(1, vol));
      const { currentTrack } = get();

      if (currentTrack?.source === 'youtube') {
        youtubeBridge.setVolume(clamped);
      } else if (audio) {
        audio.volume = clamped;
      }

      set({ volume: clamped, isMuted: clamped === 0 });
    },

    toggleMute: () => {
      const { isMuted, volume, currentTrack } = get();
      const nextMuted = !isMuted;

      if (currentTrack?.source === 'youtube') {
        if (nextMuted) {
          youtubeBridge.mute();
        } else {
          youtubeBridge.unMute();
          youtubeBridge.setVolume(volume || 0.8);
        }
      } else if (audio) {
        audio.volume = nextMuted ? 0 : (volume || 0.8);
      }

      set({ isMuted: nextMuted });
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
      } catch {
        set({
          currentTrack: { ...currentTrack, isLiked: !nextLiked },
          queue: get().queue.map((t) => (t.id === currentTrack.id ? { ...t, isLiked: !nextLiked } : t)),
        });
      }
    },
  };
});
