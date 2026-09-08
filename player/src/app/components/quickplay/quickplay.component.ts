import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { LibraryService } from '../../services/library.service';
import { SettingsService, ZuneAccent } from '../../services/settings.service';
import { AudioService } from '../../services/audio.service';
import { TrackRecord, PlaylistRecord } from '../../services/db.service';
import { AlbumArtComponent } from '../album-art/album-art.component';
import { PlaylistModalService } from '../../services/playlist-modal.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-quickplay',
  standalone: true,
  imports: [CommonModule, AlbumArtComponent, DragDropModule],
  templateUrl: './quickplay.component.html',
  styleUrl: './quickplay.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickplayComponent {
  accentOptions: ZuneAccent[] = ['orange', 'magenta', 'cyan', 'green', 'red', 'yellow'];

  newTracks = computed(() => {
    const tracks = this.libraryService.tracks();
    const seenAlbums = new Set<string>();
    const uniqueAlbumTracks: TrackRecord[] = [];
    
    // Sort by id descending (newest first)
    const sorted = [...tracks].sort((a, b) => (b.id || 0) - (a.id || 0));
    for (const t of sorted) {
      const albumIdentifier = (t.album || t.albumArtKey || t.title).toLowerCase().trim();
      if (!seenAlbums.has(albumIdentifier)) {
        seenAlbums.add(albumIdentifier);
        uniqueAlbumTracks.push(t);
        if (uniqueAlbumTracks.length >= 6) break;
      }
    }
    return uniqueAlbumTracks;
  });

  recentTracks = computed(() => {
    return this.libraryService.history().slice(0, 6);
  });

  playlists = computed(() => {
    return this.libraryService.playlists().slice(0, 6);
  });

  constructor(
    public settingsService: SettingsService,
    public libraryService: LibraryService,
    private audioService: AudioService,
    public playlistModal: PlaylistModalService,
    public modalService: ModalService
  ) {}

  playTrack(track: TrackRecord) {
    this.audioService.playTrack(track, [track]);
  }

  playPlaylist(playlist: PlaylistRecord) {
    const allTracks = this.libraryService.tracks();
    const tracksToPlay: TrackRecord[] = [];
    for (const path of playlist.trackPaths) {
      const t = allTracks.find(track => track.filePath === path);
      if (t) {
        tracksToPlay.push(t);
      }
    }
    if (tracksToPlay.length > 0) {
      this.audioService.playTrack(tracksToPlay[0], tracksToPlay);
    }
  }

  private mosaicCache = new Map<string, string[]>();

  trackByTrackId(index: number, track: TrackRecord): any {
    return track.id || track.filePath || index;
  }

  trackByPlaylistId(index: number, pl: PlaylistRecord): any {
    return pl.id || pl.name || index;
  }

  trackByIndex(index: number): number {
    return index;
  }

  getPlaylistCount(playlist: PlaylistRecord): number {
    return playlist.trackPaths.length;
  }

  getPlaylistMosaicArts(playlist: PlaylistRecord): string[] {
    const tracks = this.libraryService.tracks();
    const cacheKey = `${playlist.id || playlist.name}_${playlist.trackPaths.join(',')}_${tracks.length}`;
    const cached = this.mosaicCache.get(cacheKey);
    if (cached) return cached;

    const pathMap = new Map<string, string>();
    for (const t of tracks) {
      if (t.albumArtKey && t.filePath) {
        pathMap.set(t.filePath, t.albumArtKey);
      }
    }

    const artKeys: string[] = [];
    for (const path of playlist.trackPaths) {
      const artKey = pathMap.get(path);
      if (artKey && !artKeys.includes(artKey)) {
        artKeys.push(artKey);
      }
    }
    
    let result: string[];
    if (artKeys.length === 0) {
      result = Array(3).fill('');
    } else {
      result = [];
      for (let i = 0; i < 3; i++) {
        result.push(artKeys[i % artKeys.length]);
      }
    }

    this.mosaicCache.set(cacheKey, result);
    return result;
  }

  getPlaylistGridArts(playlist: PlaylistRecord): string[] {
    const tracks = this.libraryService.tracks();
    const artKeys: string[] = [];
    for (const path of playlist.trackPaths) {
      const t = tracks.find(track => track.filePath === path);
      if (t?.albumArtKey && !artKeys.includes(t.albumArtKey)) {
        artKeys.push(t.albumArtKey);
      }
    }
    
    if (artKeys.length === 0) {
      return Array(6).fill('');
    }

    const result: string[] = [];
    for (let i = 0; i < 6; i++) {
      result.push(artKeys[i % artKeys.length]);
    }
    return result;
  }

  getPlaylistArtKeys(playlist: PlaylistRecord): string[] {
    const keys: string[] = [];
    const tracks = this.libraryService.tracks();
    for (const path of playlist.trackPaths) {
      const track = tracks.find(t => t.filePath === path);
      if (track?.albumArtKey) {
        if (!keys.includes(track.albumArtKey)) {
          keys.push(track.albumArtKey);
          if (keys.length >= 4) break;
        }
      }
    }
    return keys;
  }

  getPlaylistArtKey(playlist: PlaylistRecord): string | undefined {
    if (playlist.trackPaths.length === 0) return undefined;
    const firstPath = playlist.trackPaths[0];
    const track = this.libraryService.tracks().find(t => t.filePath === firstPath);
    return track?.albumArtKey;
  }

  deletePlaylist(event: Event, id: number) {
    event.stopPropagation();
    const playlist = this.libraryService.playlists().find(p => p.id === id);
    const name = playlist ? playlist.name : '';
    this.modalService.open({
      type: 'confirm-delete',
      title: 'delete playlist',
      description: `are you sure you want to delete "${name}"? this action cannot be undone.`,
      confirmLabel: 'delete',
      cancelLabel: 'cancel',
      onConfirm: async () => {
        await this.libraryService.deletePlaylist(id);
        await this.libraryService.loadLibrary();
      }
    });
  }

  editPlaylist(event: Event, playlist: PlaylistRecord) {
    event.stopPropagation();
    this.playlistModal.openEdit(playlist);
  }

  getAccentColorHex(accent: string): string {
    switch (accent) {
      case 'orange': return '#ff5000';
      case 'magenta': return '#e5007d';
      case 'cyan': return '#00a2e8';
      case 'green': return '#8cbf26';
      case 'red': return '#e50914';
      case 'yellow': return '#ffb900';
      default: return '#e5007d';
    }
  }
}
