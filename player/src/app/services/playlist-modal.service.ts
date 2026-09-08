import { Injectable, signal, computed } from '@angular/core';
import { LibraryService } from './library.service';
import { DbService, TrackRecord, PlaylistRecord } from './db.service';

/** Drives all playlist-related modals rendered at the root app level,
 *  so they are never inside a CSS stacking context from component animations. */
@Injectable({ providedIn: 'root' })
export class PlaylistModalService {
  // Add to Playlist Modal State
  activeTrack = signal<TrackRecord | null>(null);
  selectedPlaylistIds = signal<number[]>([]);
  newPlaylistName = signal<string>('');

  // Edit Playlist Modal State
  editingPlaylist = signal<PlaylistRecord | null>(null);
  editingPlaylistName = signal<string>('');
  editingPlaylistTracks = signal<TrackRecord[]>([]);

  // Save Queue Modal State
  activeSaveQueue = signal<boolean>(false);
  saveQueueTracks = signal<string[]>([]);
  saveQueuePlaylistName = signal<string>('');

  constructor(
    public libraryService: LibraryService,
    private db: DbService
  ) {}

  /* ─── Add To Playlist Modal ────────────────────────────────────────────── */
  open(track: TrackRecord) {
    this.activeTrack.set(track);
    const alreadyIn = this.libraryService
      .playlists()
      .filter(pl => pl.trackPaths.includes(track.filePath))
      .map(pl => pl.id!);
    this.selectedPlaylistIds.set(alreadyIn);
    this.newPlaylistName.set('');
  }

  close() {
    this.activeTrack.set(null);
    this.selectedPlaylistIds.set([]);
    this.newPlaylistName.set('');
  }

  togglePlaylistSelection(playlistId: number) {
    const current = [...this.selectedPlaylistIds()];
    const idx = current.indexOf(playlistId);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(playlistId);
    }
    this.selectedPlaylistIds.set(current);
  }

  async createPlaylist() {
    const name = this.newPlaylistName().trim();
    if (!name) return;
    const track = this.activeTrack();
    if (!track) return;

    await this.libraryService.createPlaylist(name, [track.filePath]);
    await this.libraryService.loadLibrary();

    const created = this.libraryService.playlists().find(p => p.name === name);
    if (created?.id) {
      const current = [...this.selectedPlaylistIds()];
      if (!current.includes(created.id)) {
        current.push(created.id);
        this.selectedPlaylistIds.set(current);
      }
    }
    this.newPlaylistName.set('');
  }

  async save() {
    const track = this.activeTrack();
    if (!track) return;

    const playlists = this.libraryService.playlists();
    const selectedIds = this.selectedPlaylistIds();

    for (const pl of playlists) {
      const isSelected = selectedIds.includes(pl.id!);
      const hasTrack = pl.trackPaths.includes(track.filePath);

      if (isSelected && !hasTrack) {
        await this.db.playlists.update(pl.id!, {
          trackPaths: [...pl.trackPaths, track.filePath],
        });
      } else if (!isSelected && hasTrack) {
        await this.db.playlists.update(pl.id!, {
          trackPaths: pl.trackPaths.filter(p => p !== track.filePath),
        });
      }
    }

    await this.libraryService.loadLibrary();
    this.close();
  }

  /* ─── Edit Playlist Modal ─────────────────────────────────────────────── */
  openEdit(playlist: PlaylistRecord) {
    this.editingPlaylist.set(playlist);
    this.editingPlaylistName.set(playlist.name);
    
    const allTracks = this.libraryService.tracks();
    const resolvedTracks: TrackRecord[] = [];
    for (const path of playlist.trackPaths) {
      const t = allTracks.find(track => track.filePath === path);
      if (t) {
        resolvedTracks.push(t);
      }
    }
    this.editingPlaylistTracks.set(resolvedTracks);
  }

  closeEdit() {
    this.editingPlaylist.set(null);
    this.editingPlaylistName.set('');
    this.editingPlaylistTracks.set([]);
  }

  removeTrackFromEditing(index: number) {
    const updated = [...this.editingPlaylistTracks()];
    updated.splice(index, 1);
    this.editingPlaylistTracks.set(updated);
  }

  moveTrackInEditing(index: number, direction: 'up' | 'down') {
    const updated = [...this.editingPlaylistTracks()];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < updated.length) {
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      this.editingPlaylistTracks.set(updated);
    }
  }

  onDropTrack(previousIndex: number, currentIndex: number) {
    const tracks = [...this.editingPlaylistTracks()];
    const [moved] = tracks.splice(previousIndex, 1);
    tracks.splice(currentIndex, 0, moved);
    this.editingPlaylistTracks.set(tracks);
  }

  async savePlaylistChanges() {
    const playlist = this.editingPlaylist();
    const name = this.editingPlaylistName().trim();
    if (!playlist || !name) return;

    const trackPaths = this.editingPlaylistTracks().map(t => t.filePath);
    await this.db.playlists.update(playlist.id!, {
      name: name,
      trackPaths: trackPaths
    });
    await this.libraryService.loadLibrary();
    this.closeEdit();
  }

  /* ─── Save Queue Modal ────────────────────────────────────────────────── */
  openSaveQueue(trackPaths: string[]) {
    this.saveQueueTracks.set(trackPaths);
    this.saveQueuePlaylistName.set('my playlist');
    this.activeSaveQueue.set(true);
  }

  closeSaveQueue() {
    this.activeSaveQueue.set(false);
    this.saveQueueTracks.set([]);
    this.saveQueuePlaylistName.set('');
  }

  async confirmSaveQueue() {
    const name = this.saveQueuePlaylistName().trim();
    if (!name) return;
    const paths = this.saveQueueTracks();
    if (paths.length === 0) return;
    await this.libraryService.createPlaylist(name, paths);
    await this.libraryService.loadLibrary();
    this.closeSaveQueue();
  }

  /* ─── Create Playlist Modal ───────────────────────────────────────────── */
  activeCreatePlaylist = signal<boolean>(false);
  createPlaylistName = signal<string>('');
  createPlaylistSelectedTrackPaths = signal<string[]>([]);
  createPlaylistSearchQuery = signal<string>('');

  createPlaylistFilteredTracks = computed(() => {
    const tracks = this.libraryService.tracks();
    const query = this.createPlaylistSearchQuery().trim().toLowerCase();
    if (!query) return tracks;
    return tracks.filter(
      track =>
        (track.title || '').toLowerCase().includes(query) ||
        (track.artist || '').toLowerCase().includes(query) ||
        (track.album || '').toLowerCase().includes(query)
    );
  });

  openCreatePlaylist() {
    this.createPlaylistName.set('');
    this.createPlaylistSelectedTrackPaths.set([]);
    this.createPlaylistSearchQuery.set('');
    this.activeCreatePlaylist.set(true);
  }

  closeCreatePlaylist() {
    this.activeCreatePlaylist.set(false);
    this.createPlaylistName.set('');
    this.createPlaylistSelectedTrackPaths.set([]);
    this.createPlaylistSearchQuery.set('');
  }

  toggleCreatePlaylistTrack(filePath: string) {
    const current = [...this.createPlaylistSelectedTrackPaths()];
    const idx = current.indexOf(filePath);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(filePath);
    }
    this.createPlaylistSelectedTrackPaths.set(current);
  }

  async confirmCreatePlaylist() {
    const name = this.createPlaylistName().trim();
    if (!name) return;
    const paths = this.createPlaylistSelectedTrackPaths();
    await this.libraryService.createPlaylist(name, paths);
    await this.libraryService.loadLibrary();
    this.closeCreatePlaylist();
  }
}
