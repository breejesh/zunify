import { Injectable, signal, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TrackRecord, DbService } from './db.service';
import { LibraryService } from './library.service';
import { DEMO_AUDIO_FILES } from './demo-data';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audio!: HTMLAudioElement;
  private currentObjectUrl: string | null = null;

  // Angular Signals for reactive state
  currentTrack = signal<TrackRecord | null>(null);
  isPlaying = signal<boolean>(false);
  currentTime = signal<number>(0);
  duration = signal<number>(0);
  volume = signal<number>(50); // default volume 50%
  isMuted = signal<boolean>(false);
  queue = signal<TrackRecord[]>([]);
  currentIndex = signal<number>(-1);
  shuffle = signal<boolean>(false);
  repeat = signal<'off' | 'all' | 'one'>('off');

  // Track original queue for shuffle toggle
  private originalQueue: TrackRecord[] = [];
  isBrowser = false;

  constructor(
    private libraryService: LibraryService,
    private db: DbService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.audio = new Audio();
      this.initAudioListeners();
      this.initMediaSession();

      // Set initial volume
      this.audio.volume = this.volume() / 100;
      this.restoreState();
    }
  }

  private initAudioListeners() {
    this.audio.addEventListener('timeupdate', () => {
      this.currentTime.set(this.audio.currentTime);
      localStorage.setItem('zunify-current-time', this.audio.currentTime.toString());
    });

    this.audio.addEventListener('durationchange', () => {
      if (!isNaN(this.audio.duration)) {
        this.duration.set(this.audio.duration);
        // Also update track duration in DB if it was 0
        const currentTrack = this.currentTrack();
        if (currentTrack && currentTrack.duration === 0) {
          this.db.tracks.update(currentTrack.id!, { duration: this.audio.duration });
        }
      }
    });

    this.audio.addEventListener('ended', () => {
      this.handleSongEnded();
    });

    this.audio.addEventListener('play', () => {
      this.isPlaying.set(true);
      this.updateMediaSessionPlaybackState('playing');
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying.set(false);
      this.updateMediaSessionPlaybackState('paused');
    });
  }

  // Play a track directly
  async playTrack(track: TrackRecord, customQueue: TrackRecord[] = []) {
    // If double clicked a track, establish a queue
    if (customQueue.length > 0) {
      this.originalQueue = [...customQueue];
      if (this.shuffle()) {
        const shuffled = this.shuffleArray([...customQueue], track);
        this.queue.set(shuffled);
        const idx = shuffled.findIndex(t => t.id === track.id);
        this.currentIndex.set(idx);
      } else {
        this.queue.set(customQueue);
        const idx = customQueue.findIndex(t => t.id === track.id);
        this.currentIndex.set(idx);
      }
    } else {
      // Add to queue if not present
      const currentQueue = this.queue();
      const idx = currentQueue.findIndex(t => t.id === track.id);
      if (idx === -1) {
        this.queue.set([...currentQueue, track]);
        this.currentIndex.set(this.queue().length - 1);
        this.originalQueue.push(track);
      } else {
        this.currentIndex.set(idx);
      }
    }

    await this.loadAndPlay(track);
    this.persistState();
  }

  // Load file and play
  private async loadAndPlay(track: TrackRecord) {
    try {
      this.audio.pause();
      this.currentTrack.set(track);

      // Clean up previous URL object to free memory
      if (this.currentObjectUrl) {
        URL.revokeObjectURL(this.currentObjectUrl);
        this.currentObjectUrl = null;
      }

      // If it's a demo track, load the real MP3 file directly
      if (track.filePath.startsWith('demo:')) {
        const audioSrc = DEMO_AUDIO_FILES[track.filePath] || 'assets/audio/returning_home.mp3';
        this.audio.src = audioSrc;
      } else {
        // Fetch file from Library
        const file = await this.libraryService.getTrackFile(track);
        this.currentObjectUrl = URL.createObjectURL(file);
        this.audio.src = this.currentObjectUrl;
      }
      
      this.audio.loop = false;
      this.currentTime.set(0);
      this.audio.load();
      await this.audio.play();

      // Update play count in db and in-memory signal without full library reload
      if (track.id) {
        await this.db.incrementPlayCount(track.id);
        this.libraryService.updateTrackPlayCount(track.id);
      }

      this.updateMediaSessionMetadata(track);
      this.persistState();
    } catch (err) {
      console.error('Error playing file:', err);
      // Skip to next if this fails (e.g. permission issue or deleted file)
      if (this.queue().length > 1) {
        this.next();
      }
    }
  }

  play() {
    if (this.currentTrack()) {
      this.audio.play();
    }
  }

  pause() {
    this.audio.pause();
  }

  togglePlay() {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  next() {
    const queue = this.queue();
    const currentIndex = this.currentIndex();
    if (queue.length === 0) return;

    let nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      if (this.repeat() === 'all' || this.repeat() === 'one') {
        nextIndex = 0;
      } else {
        // End of queue
        return;
      }
    }

    this.currentIndex.set(nextIndex);
    this.loadAndPlay(queue[nextIndex]);
    this.persistState();
  }

  prev() {
    const queue = this.queue();
    const currentIndex = this.currentIndex();
    if (queue.length === 0) return;

    // If song is more than 3 seconds in, restart the song
    if (this.audio.currentTime > 3) {
      this.seek(0);
      return;
    }

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (this.repeat() === 'all' || this.repeat() === 'one') {
        prevIndex = queue.length - 1;
      } else {
        // Stay on first song
        prevIndex = 0;
      }
    }

    this.currentIndex.set(prevIndex);
    this.loadAndPlay(queue[prevIndex]);
    this.persistState();
  }

  playQueueIndex(index: number) {
    const queue = this.queue();
    if (index >= 0 && index < queue.length) {
      this.currentIndex.set(index);
      this.loadAndPlay(queue[index]);
      this.persistState();
    }
  }

  seek(seconds: number) {
    this.audio.currentTime = seconds;
    this.currentTime.set(seconds);
  }

  setVolume(vol: number) {
    // Vol between 0 and 100
    this.volume.set(vol);
    this.audio.volume = vol / 100;
    this.persistState();
  }

  toggleMute() {
    const currentMute = this.isMuted();
    this.isMuted.set(!currentMute);
    this.audio.muted = !currentMute;
    this.persistState();
  }

  toggleShuffle() {
    const currentShuffle = !this.shuffle();
    this.shuffle.set(currentShuffle);

    const currentTrack = this.currentTrack();

    if (currentShuffle) {
      // Shuffle the queue, keeping current track at its relative place or first
      if (currentTrack) {
        const filtered = this.originalQueue.filter(t => t.id !== currentTrack.id);
        const shuffled = [currentTrack, ...this.shuffleArray(filtered)];
        this.queue.set(shuffled);
        this.currentIndex.set(0);
      } else {
        const shuffled = this.shuffleArray([...this.originalQueue]);
        this.queue.set(shuffled);
        this.currentIndex.set(-1);
      }
    } else {
      // Restore original queue
      this.queue.set([...this.originalQueue]);
      if (currentTrack) {
        const idx = this.originalQueue.findIndex(t => t.id === currentTrack.id);
        this.currentIndex.set(idx);
      }
    }
    this.persistState();
  }

  toggleRepeat() {
    const current = this.repeat();
    let nextVal: 'off' | 'all' | 'one' = 'off';
    if (current === 'off') nextVal = 'all';
    else if (current === 'all') nextVal = 'one';
    else if (current === 'one') nextVal = 'off';
    this.repeat.set(nextVal);
    this.audio.loop = false; // Always use event-driven replay
    this.persistState();
  }

  private async handleSongEnded() {
    if (this.repeat() === 'one') {
      await this.replayCurrentTrack();
    } else {
      this.next();
    }
  }

  async replayCurrentTrack() {
    const cur = this.currentTrack();
    if (cur) {
      await this.loadAndPlay(cur);
    }
  }

  // Helper to shuffle array
  private shuffleArray(array: TrackRecord[], excludeItem?: TrackRecord): TrackRecord[] {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // System Media Session API Sync
  private initMediaSession() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          this.seek(details.seekTime);
        }
      });
    }
  }

  private async updateMediaSessionMetadata(track: TrackRecord) {
    if ('mediaSession' in navigator) {
      let artwork: MediaImage[] = [];

      // Look up artwork in IndexedDB
      if (track.albumArtKey) {
        const cachedArt = await this.db.getAlbumArt(track.albumArtKey);
        if (cachedArt) {
          const url = URL.createObjectURL(cachedArt.blob);
          artwork = [
            { src: url, sizes: '512x512', type: cachedArt.mimeType }
          ];
        }
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: artwork
      });
    }
  }

  private updateMediaSessionPlaybackState(state: 'playing' | 'paused' | 'none') {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = state;
    }
  }

  private persistState() {
    if (!this.isBrowser) return;
    localStorage.setItem('zunify-volume', this.volume().toString());
    localStorage.setItem('zunify-muted', this.isMuted().toString());
    localStorage.setItem('zunify-repeat', this.repeat());
    localStorage.setItem('zunify-shuffle', this.shuffle().toString());
    localStorage.setItem('zunify-current-index', this.currentIndex().toString());
    
    const track = this.currentTrack();
    if (track) {
      localStorage.setItem('zunify-current-track', JSON.stringify(track));
    } else {
      localStorage.removeItem('zunify-current-track');
    }
    
    localStorage.setItem('zunify-queue', JSON.stringify(this.queue()));
    localStorage.setItem('zunify-original-queue', JSON.stringify(this.originalQueue));
  }

  async restoreState() {
    if (!this.isBrowser) return;
    try {
      const v = localStorage.getItem('zunify-volume');
      if (v) {
        this.volume.set(parseInt(v, 10));
        this.audio.volume = this.volume() / 100;
      }
      
      const m = localStorage.getItem('zunify-muted');
      if (m) {
        this.isMuted.set(m === 'true');
        this.audio.muted = this.isMuted();
      }
      
      const r = localStorage.getItem('zunify-repeat') as 'off' | 'all' | 'one';
      if (r) {
        this.repeat.set(r);
        this.audio.loop = false;
      }

      const s = localStorage.getItem('zunify-shuffle');
      if (s) this.shuffle.set(s === 'true');

      const qStr = localStorage.getItem('zunify-queue');
      if (qStr) {
        const parsed = JSON.parse(qStr);
        this.queue.set(parsed);
      }

      const oqStr = localStorage.getItem('zunify-original-queue');
      if (oqStr) {
        this.originalQueue = JSON.parse(oqStr);
      }

      const cIdx = localStorage.getItem('zunify-current-index');
      if (cIdx) this.currentIndex.set(parseInt(cIdx, 10));

      const cTrackStr = localStorage.getItem('zunify-current-track');
      if (cTrackStr) {
        const track = JSON.parse(cTrackStr) as TrackRecord;
        this.currentTrack.set(track);

        try {
          if (track.filePath.startsWith('demo:')) {
            const audioSrc = DEMO_AUDIO_FILES[track.filePath] || 'assets/audio/returning_home.mp3';
            this.audio.src = audioSrc;
            this.audio.load();
          } else {
            const file = await this.libraryService.getTrackFile(track);
            if (file) {
              const url = URL.createObjectURL(file);
              this.currentObjectUrl = url;
              this.audio.src = url;
              this.audio.load();
            }
          }
          const cTime = localStorage.getItem('zunify-current-time');
          if (cTime) {
            const seekSec = parseFloat(cTime);
            this.audio.currentTime = seekSec;
            this.currentTime.set(seekSec);
          }
        } catch (e) {
          console.warn("Could not auto-load track file (requires user file permission):", e);
        }
      }
    } catch (e) {
      console.error("Failed to restore playback state:", e);
    }
  }
}
