declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

let isApiLoading = false;
let isApiLoaded = false;
const readyCallbacks: Array<() => void> = [];

export function loadYouTubeIframeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    if (window.YT && window.YT.Player) {
      isApiLoaded = true;
      resolve();
      return;
    }

    readyCallbacks.push(resolve);

    if (isApiLoading) return;
    isApiLoading = true;

    const originalReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      isApiLoaded = true;
      if (typeof originalReady === 'function') originalReady();
      while (readyCallbacks.length > 0) {
        const cb = readyCallbacks.shift();
        if (cb) cb();
      }
    };

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }
  });
}

class YouTubeBridge {
  private player: any = null;
  private containerId = 'vibeflow-youtube-player-hidden';
  private currentVideoId: string | null = null;
  private isReady = false;
  private intervalTimer: any = null;

  // Callbacks
  public onTimeUpdate?: (currentTime: number, duration: number) => void;
  public onStateChange?: (isPlaying: boolean) => void;
  public onEnded?: () => void;
  public onError?: (err: any) => void;

  public async init(): Promise<void> {
    await loadYouTubeIframeApi();

    return new Promise((resolve) => {
      let container = document.getElementById(this.containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = this.containerId;
        container.style.position = 'fixed';
        container.style.bottom = '-9999px';
        container.style.left = '-9999px';
        container.style.width = '200px';
        container.style.height = '200px';
        container.style.opacity = '0';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '-1000';
        document.body.appendChild(container);
      }

      if (this.player) {
        resolve();
        return;
      }

      this.player = new window.YT.Player(this.containerId, {
        width: '200',
        height: '200',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            this.isReady = true;
            this.startPoller();
            resolve();
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            if (event.data === 1) {
              if (this.onStateChange) this.onStateChange(true);
            } else if (event.data === 2) {
              if (this.onStateChange) this.onStateChange(false);
            } else if (event.data === 0) {
              if (this.onStateChange) this.onStateChange(false);
              if (this.onEnded) this.onEnded();
            }
          },
          onError: (e: any) => {
            console.warn('[YouTubeBridge] Playback error:', e);
            if (this.onError) this.onError(e);
          },
        },
      });
    });
  }

  private startPoller() {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    this.intervalTimer = setInterval(() => {
      if (this.player && this.isReady && typeof this.player.getCurrentTime === 'function') {
        try {
          const current = this.player.getCurrentTime() || 0;
          const total = this.player.getDuration() || 0;
          if (this.onTimeUpdate) this.onTimeUpdate(current, total);
        } catch {}
      }
    }, 400);
  }

  public async playVideo(videoId: string, volume: number = 0.8): Promise<void> {
    if (!this.player || !this.isReady) {
      await this.init();
    }

    this.currentVideoId = videoId;
    if (this.player && typeof this.player.loadVideoById === 'function') {
      this.player.loadVideoById(videoId);
      this.setVolume(volume);
      this.player.playVideo();
    }
  }

  public pause(): void {
    if (this.player && this.isReady && typeof this.player.pauseVideo === 'function') {
      this.player.pauseVideo();
    }
  }

  public play(): void {
    if (this.player && this.isReady && typeof this.player.playVideo === 'function') {
      this.player.playVideo();
    }
  }

  public seekTo(seconds: number): void {
    if (this.player && this.isReady && typeof this.player.seekTo === 'function') {
      this.player.seekTo(seconds, true);
    }
  }

  public setVolume(vol: number): void {
    if (this.player && this.isReady && typeof this.player.setVolume === 'function') {
      this.player.setVolume(Math.round(vol * 100));
    }
  }

  public mute(): void {
    if (this.player && this.isReady && typeof this.player.mute === 'function') {
      this.player.mute();
    }
  }

  public unMute(): void {
    if (this.player && this.isReady && typeof this.player.unMute === 'function') {
      this.player.unMute();
    }
  }

  public stop(): void {
    if (this.player && this.isReady && typeof this.player.stopVideo === 'function') {
      this.player.stopVideo();
    }
  }

  public getCurrentVideoId(): string | null {
    return this.currentVideoId;
  }
}

export const youtubeBridge = new YouTubeBridge();
