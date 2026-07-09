import { Component, computed } from '@angular/core';
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
    private db: DbService
  ) {
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
