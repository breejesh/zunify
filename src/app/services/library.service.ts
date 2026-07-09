import { Injectable, signal } from '@angular/core';
import { DbService, TrackRecord, FolderRecord, PlaylistRecord } from './db.service';
import { BehaviorSubject } from 'rxjs';

// Import music-metadata-browser
import { parseBlob } from 'music-metadata-browser';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  isScanning$ = new BehaviorSubject<boolean>(false);
  scannedCount$ = new BehaviorSubject<number>(0);
  totalCount$ = new BehaviorSubject<number>(0);
  scanningFolder$ = new BehaviorSubject<string>('');

  // Signals for responsive UI updates
  tracks = signal<TrackRecord[]>([]);
  folders = signal<FolderRecord[]>([]);
  playlists = signal<PlaylistRecord[]>([]);
  history = signal<TrackRecord[]>([]);
  isLoading = signal<boolean>(true);

  constructor(private db: DbService) {
    this.loadLibrary();
  }

  // Load library from DB on startup
  async loadLibrary() {
    this.isLoading.set(true);
    try {
      const allTracks = await this.db.getAllTracks();
      this.tracks.set(allTracks);

      const allFolders = await this.db.folders.toArray();
      this.folders.set(allFolders);

      // Resolve history tracks by matching file paths
      const histRecords = await this.db.getPlaybackHistory();
      const histTracks: TrackRecord[] = [];
      for (const h of histRecords) {
        const found = allTracks.find(t => t.filePath === h.filePath);
        if (found) {
          histTracks.push(found);
        }
      }
      this.history.set(histTracks);

      // Load playlists
      const allPlaylists = await this.db.getPlaylists();
      this.playlists.set(allPlaylists);
    } catch (err) {
      console.error('Error loading library:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Playlist management helpers
  async createPlaylist(name: string, trackPaths: string[]) {
    await this.db.createPlaylist(name, trackPaths);
    await this.loadLibrary();
  }

  async deletePlaylist(id: number) {
    await this.db.deletePlaylist(id);
    await this.loadLibrary();
  }

  // Verify/Request directory handle permissions
  async verifyPermission(handle: any, withWrite = false): Promise<boolean> {
    const opts = {
      mode: (withWrite ? 'readwrite' : 'read') as any
    };

    if ((await handle.queryPermission(opts)) === 'granted') {
      return true;
    }

    if ((await handle.requestPermission(opts)) === 'granted') {
      return true;
    }

    return false;
  }

  // Pick a new folder and scan it
  async addFolder() {
    try {
      const handle = await (window as any).showDirectoryPicker();
      const pathName = handle.name;

      // Check if folder is already added
      const existing = await this.db.folders.where('pathName').equals(pathName).first();
      let folderId: number;

      if (existing) {
        folderId = existing.id!;
        // Update handle in case it changed
        await this.db.folders.update(folderId, { handle });
      } else {
        folderId = await this.db.folders.add({
          pathName,
          handle,
          lastScanned: 0
        });
      }

      await this.loadLibrary();
      await this.scanFolder(folderId, handle, pathName);
    } catch (err) {
      console.error('Error adding folder:', err);
    }
  }

  // Scan folder handle and update DB
  async scanFolder(folderId: number, handle: FileSystemDirectoryHandle, pathName: string) {
    this.isScanning$.next(true);
    this.scannedCount$.next(0);
    this.totalCount$.next(0);
    this.scanningFolder$.next(pathName);

    try {
      // 1. Verify Permission
      const permitted = await this.verifyPermission(handle);
      if (!permitted) {
        throw new Error('Permission not granted to scan folder');
      }

      // 2. Count total supported audio files first
      let totalAudioFiles = 0;
      const countFiles = async (dirHandle: any) => {
        for await (const entry of (dirHandle as any).values()) {
          if (entry.kind === 'file') {
            const ext = entry.name.split('.').pop()?.toLowerCase();
            if (ext && ['mp3', 'flac', 'm4a', 'wav', 'ogg', 'aac'].includes(ext)) {
              totalAudioFiles++;
            }
          } else if (entry.kind === 'directory') {
            await countFiles(entry);
          }
        }
      };
      await countFiles(handle);
      this.totalCount$.next(totalAudioFiles);

      // 3. Process and parse files recursively
      let currentScanned = 0;
      // Keep track of existing tracks in DB for this folder so we can remove deleted ones
      const existingTracks = await this.db.tracks.where('folderId').equals(folderId).toArray();
      const existingPaths = new Set(existingTracks.map(t => t.filePath));
      const scannedPaths = new Set<string>();

      const processDirectory = async (dirHandle: any, relativePath: string) => {
        for await (const entry of (dirHandle as any).values()) {
          const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
          if (entry.kind === 'file') {
            const ext = entry.name.split('.').pop()?.toLowerCase();
            if (ext && ['mp3', 'flac', 'm4a', 'wav', 'ogg', 'aac'].includes(ext)) {
              scannedPaths.add(entryPath);
              try {
                const alreadyIndexed = existingPaths.has(entryPath);
                let needsRescan = !alreadyIndexed;
                if (alreadyIndexed) {
                  const existingTrack = existingTracks.find(t => t.filePath === entryPath);
                  if (existingTrack && (existingTrack.artist === 'Unknown Artist' || existingTrack.album === 'Unknown Album' || existingTrack.artist === 'Unknown')) {
                    needsRescan = true;
                    if (existingTrack.id) {
                      await this.db.tracks.delete(existingTrack.id);
                    }
                  }
                }
                if (needsRescan) {
                  const file = await (entry as any).getFile();
                  await this.indexAudioFile(file, folderId, entryPath);
                }
              } catch (e) {
                console.error('Error indexing file:', entryPath, e);
              }
              currentScanned++;
              this.scannedCount$.next(currentScanned);
            }
          } else if (entry.kind === 'directory') {
            await processDirectory(entry, entryPath);
          }
        }
      };

      await processDirectory(handle, '');

      // 4. Remove tracks that were deleted from disk
      for (const track of existingTracks) {
        if (!scannedPaths.has(track.filePath)) {
          await this.db.tracks.delete(track.id!);
          // If album art is no longer used, we could clean it up, but leaving it is fine for now
        }
      }

      // 5. Update last scanned timestamp
      await this.db.folders.update(folderId, { lastScanned: Date.now() });
      await this.loadLibrary();
    } catch (err) {
      console.error('Error scanning folder:', err);
    } finally {
      this.isScanning$.next(false);
      this.scanningFolder$.next('');
    }
  }

  // Scan all added folders
  async scanAllFolders() {
    const allFolders = await this.db.folders.toArray();
    for (const folder of allFolders) {
      try {
        await this.scanFolder(folder.id!, folder.handle, folder.pathName);
      } catch (err) {
        console.error(`Error scanning folder ${folder.pathName}:`, err);
      }
    }
  }

  // Parse a file and insert metadata into DB
  private async indexAudioFile(file: File, folderId: number, filePath: string) {
    let title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    let artist = 'Unknown Artist';
    let album = 'Unknown Album';
    let genre = 'Unknown';
    let duration = 0;
    let trackNumber: number | undefined = undefined;
    let year: number | undefined = undefined;
    let albumArtKey: string | undefined = undefined;

    try {
      const metadata = await parseBlob(file);
      
      if (metadata.common.title) title = metadata.common.title;
      if (metadata.common.artist) artist = metadata.common.artist;
      if (metadata.common.album) album = metadata.common.album;
      if (metadata.common.genre && metadata.common.genre.length > 0) {
        genre = metadata.common.genre[0];
      }
      if (metadata.format.duration) duration = metadata.format.duration;
      if (metadata.common.track && metadata.common.track.no) {
        trackNumber = metadata.common.track.no;
      }
      if (metadata.common.year) year = metadata.common.year;

      // Extract album art
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const pic = metadata.common.picture[0];
        albumArtKey = `${artist} - ${album}`.toLowerCase();
        
        // Cache in DB if not already present
        const existingArt = await this.db.getAlbumArt(albumArtKey);
        if (!existingArt) {
          const blob = new Blob([new Uint8Array(pic.data)], { type: pic.format });
          await this.db.saveAlbumArt(albumArtKey, blob, pic.format);
        }
      }
    } catch (e) {
      console.error('Metadata parsing failed for file:', file.name, e);
      // Try to parse basic "Artist - Title" from file name
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const parts = nameWithoutExt.split(' - ');
      if (parts.length > 1) {
        artist = parts[0].trim();
        title = parts[1].trim();
      }
    }

    // Default duration to 0 if not found, we can load it on-demand during playback
    const record: TrackRecord = {
      filePath,
      folderId,
      title,
      artist,
      album,
      genre,
      duration,
      trackNumber,
      year,
      heart: 0,
      playCount: 0,
      albumArtKey
    };

    await this.db.tracks.add(record);
  }

  // Get track File object by searching the directory handles
  async getTrackFile(track: TrackRecord): Promise<File> {
    const folder = await this.db.folders.get(track.folderId);
    if (!folder) {
      throw new Error('Associated folder not found');
    }

    const permitted = await this.verifyPermission(folder.handle);
    if (!permitted) {
      throw new Error(`Permission denied for folder: ${folder.pathName}`);
    }

    // Traverse the relative path
    const parts = track.filePath.split('/');
    let currentDir: FileSystemDirectoryHandle = folder.handle;

    for (let i = 0; i < parts.length - 1; i++) {
      currentDir = await currentDir.getDirectoryHandle(parts[i]);
    }

    const fileHandle = await currentDir.getFileHandle(parts[parts.length - 1]);
    return await fileHandle.getFile();
  }

  async removeFolder(folderId: number) {
    await this.db.transaction('rw', [this.db.folders, this.db.tracks], async () => {
      await this.db.folders.delete(folderId);
      await this.db.tracks.where('folderId').equals(folderId).delete();
    });
    await this.loadLibrary();
  }
}
