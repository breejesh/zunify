import { Component, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, ZunifyView } from './services/settings.service';
import { AudioService } from './services/audio.service';
import { LibraryService } from './services/library.service';
import { DbService } from './services/db.service';
import { ModalService } from './services/modal.service';
import { PlaylistModalService } from './services/playlist-modal.service';
import { QuickplayComponent } from './components/quickplay/quickplay.component';
import { CollectionComponent } from './components/collection/collection.component';
import { NowPlayingComponent } from './components/now-playing/now-playing.component';
import { SettingsComponent } from './components/settings/settings.component';
import { AlbumArtComponent } from './components/album-art/album-art.component';
import { SeoService } from './services/seo.service';

import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    QuickplayComponent,
    CollectionComponent,
    NowPlayingComponent,
    SettingsComponent,
    AlbumArtComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Zunify';

  activeView = computed(() => this.settingsService.currentView());
  isPlaying = computed(() => this.audioService.isPlaying());
  currentTrack = computed(() => this.audioService.currentTrack());

  // PWA Install properties
  deferredPrompt: any = null;
  isInstallable = false;
  isStandalone = false;

  // volume getter/setter helpers for HTML template bindings
  currentVolume = computed(() => this.audioService.volume());
  currentTime = computed(() => this.audioService.currentTime());
  duration = computed(() => this.audioService.duration());

  progressPercent = computed(() => {
    const cur = this.audioService.currentTime();
    const dur = this.audioService.duration();
    return dur > 0 ? (cur / dur) * 100 : 0;
  });

  remainingTime = computed(() => {
    const cur = this.audioService.currentTime();
    const dur = this.audioService.duration();
    return Math.max(0, dur - cur);
  });

  constructor(
    public settingsService: SettingsService,
    public audioService: AudioService,
    public libraryService: LibraryService,
    public modalService: ModalService,
    public playlistModal: PlaylistModalService,
    private db: DbService,
    private seoService: SeoService
  ) {
    // Reactive SEO Meta and Structured Data Update
    effect(() => {
      const view = this.activeView();
      // Track is also tracked by this effect to dynamically change title/meta when song changes in nowplaying
      const track = this.currentTrack();
      this.updateSeoForView(view);
    });

    // Detect standalone mode
    if (typeof window !== 'undefined') {
      this.isStandalone = window.matchMedia('(display-mode: standalone)').matches;

      // Listen for PWA installation prompt
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.isInstallable = true;
      });

      window.addEventListener('appinstalled', () => {
        this.isInstallable = false;
        this.deferredPrompt = null;
        this.isStandalone = true;
      });
    }
  }

  updateSeoForView(view: string) {
    let title = 'Retro Zune Offline PWA Music Player';
    let description = 'An offline-first music player PWA built in Angular, recreating the classic Zune Desktop App Metro user interface. Scan local directories and play lossless audio.';
    let keywords = 'Zune, Music Player, Offline Player, PWA, Angular, Retro Zune, Audio Player';

    if (view === 'collection') {
      title = 'My Collection - Offline Music Library';
      description = 'Browse your offline music library, artists, albums, playlists, and songs. Fully scanned and parsed from local audio metadata.';
      keywords = 'Zune Collection, Offline Library, Music Metadata, Playlists';
    } else if (view === 'settings') {
      title = 'Settings & Customization';
      description = 'Customize your Zunify experience. Toggle light and dark themes, accent colors (magenta, orange, cyan, green, red, yellow), and reset database library.';
      keywords = 'Zune Settings, Custom Accent, Zune Themes';
    } else if (view === 'nowplaying') {
      const track = this.currentTrack();
      title = track ? `Now Playing: ${track.title} - ${track.artist}` : 'Now Playing - Zunify Player';
      description = track ? `Currently listening to "${track.title}" by ${track.artist} on Zunify Retro Music Player.` : 'See the retro Zune visualization and album art for your currently playing song.';
      keywords = 'Zune Now Playing, Retro Visualization, Music Player';
    }

    this.seoService.updateTags({
      title,
      description,
      keywords,
      url: 'https://zunify-84327.web.app',
      image: 'https://zunify-84327.web.app/assets/og-image.png',
      robots: 'index, follow'
    });

    // Inject rich search result schemas (SoftwareApplication)
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'Zunify',
      'operatingSystem': 'Web, Windows, macOS, Linux, Android, iOS',
      'applicationCategory': 'MultimediaApplication',
      'browserRequirements': 'Requires HTML5 audio capabilities and File System Access API support',
      'description': description,
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'author': {
        '@type': 'Organization',
        'name': 'Zunify Team',
        'url': 'https://zunify-84327.web.app'
      }
    };
    this.seoService.injectSchema(schema);
  }

  installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Zunify installed successfully');
        }
        this.deferredPrompt = null;
        this.isInstallable = false;
      });
    }
  }

  changeView(view: ZunifyView) {
    this.settingsService.setView(view);
  }

  goBack() {
    // Pivot back to quickplay
    this.settingsService.setView('quickplay');
  }

  togglePlay() {
    this.audioService.togglePlay();
  }

  next() {
    this.audioService.next();
  }

  prev() {
    this.audioService.prev();
  }

  toggleShuffle() {
    this.audioService.toggleShuffle();
  }

  toggleRepeat() {
    this.audioService.toggleRepeat();
  }

  onVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.audioService.setVolume(Number(input.value));
  }

  formatTime(seconds: number | null): string {
    if (seconds === null || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  onTimelineClick(event: MouseEvent) {
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percent = clickX / rect.width;
    const durVal = this.audioService.duration();
    if (durVal > 0) {
      this.audioService.seek(percent * durVal);
    }
  }

  async toggleCurrentTrackHeart(track: any, event: Event) {
    event.stopPropagation();
    if (track.id) {
      const newHeart = track.heart === 1 ? 0 : 1;
      await this.db.toggleHeart(track.id, track.heart);
      await this.libraryService.loadLibrary();
      
      const updated = await this.db.getTrackById(track.id);
      if (updated) {
        this.audioService.currentTrack.set(updated);
      }
    }
  }
}
