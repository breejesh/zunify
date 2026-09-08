import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface FolderRecord {
  id?: number;
  pathName: string;
  path?: string;
  handle: FileSystemDirectoryHandle;
  lastScanned?: number;
}

export interface TrackRecord {
  id?: number;
  filePath: string;
  folderId: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number; // in seconds
  trackNumber?: number;
  year?: number;
  heart: number; // 0 for normal, 1 for favorited
  playCount: number;
  lastPlayed?: number;
  albumArtKey?: string; // links to AlbumArtRecord
}

export interface AlbumArtRecord {
  albumKey: string; // "artist_name - album_name"
  blob: Blob;
  mimeType: string;
}

export interface PlaylistRecord {
  id?: number;
  name: string;
  trackPaths: string[]; // List of filePaths to persist across scans
  createdAt: number;
}

export interface HistoryRecord {
  id?: number;
  filePath: string;
  playedAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class DbService extends Dexie {
  folders!: Table<FolderRecord, number>;
  tracks!: Table<TrackRecord, number>;
  albumArt!: Table<AlbumArtRecord, string>;
  playlists!: Table<PlaylistRecord, number>;
  history!: Table<HistoryRecord, number>;

  constructor() {
    super('ZunifyDatabase');
    // Upgrade version to 2 to support playlists and persistent history
    this.version(2).stores({
      folders: '++id, pathName, lastScanned',
      tracks: '++id, filePath, folderId, title, artist, album, genre, heart, playCount, lastPlayed, albumArtKey',
      albumArt: 'albumKey',
      playlists: '++id, name, createdAt',
      history: '++id, filePath, playedAt'
    });

    // Version 3: Index folder path for reliable deduplication across identically-named folders
    this.version(3).stores({
      folders: '++id, pathName, path, lastScanned'
    });
  }

  // Helper methods to query the DB
  async getAllTracks(): Promise<TrackRecord[]> {
    return this.tracks.toArray();
  }

  async getTrackById(id: number): Promise<TrackRecord | undefined> {
    return this.tracks.get(id);
  }

  async toggleHeart(trackId: number, currentVal: number): Promise<void> {
    const newVal = currentVal === 1 ? 0 : 1;
    await this.tracks.update(trackId, { heart: newVal });
  }

  async incrementPlayCount(trackId: number): Promise<void> {
    const track = await this.tracks.get(trackId);
    if (track) {
      await this.tracks.update(trackId, {
        playCount: track.playCount + 1,
        lastPlayed: Date.now()
      });
      // Also write to history
      await this.addToHistory(track.filePath);
    }
  }

  // Persistent History Helpers
  async addToHistory(filePath: string): Promise<void> {
    // Delete duplicate if exists to push it to the top
    await this.history.where('filePath').equals(filePath).delete();
    
    await this.history.add({
      filePath,
      playedAt: Date.now()
    });

    // Prune history to max 50 records
    const allHistory = await this.history.orderBy('playedAt').reverse().toArray();
    if (allHistory.length > 50) {
      const toDelete = allHistory.slice(50);
      for (const record of toDelete) {
        if (record.id) {
          await this.history.delete(record.id);
        }
      }
    }
  }

  async getPlaybackHistory(): Promise<HistoryRecord[]> {
    return this.history.orderBy('playedAt').reverse().toArray();
  }

  // Playlist Helpers
  async createPlaylist(name: string, trackPaths: string[]): Promise<number> {
    return this.playlists.add({
      name,
      trackPaths,
      createdAt: Date.now()
    });
  }

  async getPlaylists(): Promise<PlaylistRecord[]> {
    return this.playlists.orderBy('createdAt').reverse().toArray();
  }

  async deletePlaylist(id: number): Promise<void> {
    await this.playlists.delete(id);
  }

  async getAlbumArt(albumKey: string): Promise<AlbumArtRecord | undefined> {
    return this.albumArt.get(albumKey);
  }

  async saveAlbumArt(albumKey: string, blob: Blob, mimeType: string): Promise<void> {
    await this.albumArt.put({ albumKey, blob, mimeType });
  }

  async clearAllData(): Promise<void> {
    await this.transaction('rw', [this.folders, this.tracks, this.albumArt, this.playlists, this.history], async () => {
      await this.folders.clear();
      await this.tracks.clear();
      await this.albumArt.clear();
      await this.playlists.clear();
      await this.history.clear();
    });
  }
}
