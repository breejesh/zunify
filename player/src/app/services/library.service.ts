import { Injectable, signal, PLATFORM_ID, Inject } from '@angular/core';
import { DbService, TrackRecord, FolderRecord, PlaylistRecord } from './db.service';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

// Import music-metadata-browser
import { parseBlob } from 'music-metadata-browser';
import { DEMO_TRACKS, generateAlbumArtRecords, getDemoTrackAudioBlob } from './demo-data';

export function isDesktopApp(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).electronAPI?.isElectron ||
    navigator.userAgent.includes('Electron')
  );
}

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

  constructor(
    private db: DbService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(platformId)) {
      this.loadLibrary();
    } else {
      this.isLoading.set(false);
    }
  }

  // Load library from DB on startup
  async loadLibrary() {
    this.isLoading.set(true);
    try {
      const isDesktop = isDesktopApp();
      let allTracks = await this.db.getAllTracks();

      if (isDesktop) {
        // MAIN SOFTWARE (DESKTOP APP):
        // Ensure demo songs and demo playlists are NEVER present in main desktop software!
        const demoTracks = allTracks.filter(t => t.filePath.startsWith('demo:'));
        if (demoTracks.length > 0) {
          for (const dt of demoTracks) {
            if (dt.id) await this.db.tracks.delete(dt.id);
          }
          allTracks = await this.db.getAllTracks();
        }

        // Clean demo playlists from desktop software
        const playlists = await this.db.getPlaylists();
        for (const p of playlists) {
          if (p.name === 'Metro Essentials' && p.trackPaths.some(tp => tp.startsWith('demo:'))) {
            if (p.id) await this.db.deletePlaylist(p.id);
          }
        }

        // Clean demo history from desktop software
        const history = await this.db.getPlaybackHistory();
        for (const h of history) {
          if (h.filePath.startsWith('demo:') && h.id) {
            await this.db.history.delete(h.id);
          }
        }
      } else {
        // WEB DEMO SANDBOX ONLY:
        // Pre-seed demo library if empty so web visitors can test playback
        if (allTracks.length === 0) {
          await this.seedDemoLibrary();
          allTracks = await this.db.getAllTracks();
        }
      }
      const allFolders = await this.db.folders.toArray();

      // Drop tracks whose folder no longer exists (e.g. left behind by older builds);
      // they can never be played and would otherwise linger in the collection forever.
      const folderIds = new Set(allFolders.map(f => f.id));
      const orphans = allTracks.filter(t => !t.filePath.startsWith('demo:') && !folderIds.has(t.folderId));
      if (orphans.length > 0) {
        await this.db.tracks.bulkDelete(orphans.map(t => t.id!));
        allTracks = allTracks.filter(t => !orphans.includes(t));
      }
      this.tracks.set(allTracks);

      // Backfill missing paths for existing folders if possible
      for (const folder of allFolders) {
        if (!folder.path && folder.handle) {
          try {
            const resolved = await this.resolveDirectoryPath(folder.handle);
            if (resolved) {
              folder.path = resolved;
              await this.db.folders.update(folder.id!, { path: resolved });
            }
          } catch {}
        }
      }
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

  // Pre-seed demo library with public domain / royalty-free music and artwork
  private async seedDemoLibrary() {
    try {
      // 1. Seed custom artistic SVG album art blobs into DB
      const artRecords = generateAlbumArtRecords();
      for (const art of artRecords) {
        await this.db.saveAlbumArt(art.albumKey, art.blob, art.mimeType);
      }

      // 2. Seed 26 public domain / royalty free tracks
      await this.db.tracks.bulkAdd(DEMO_TRACKS as any);

      // 3. Seed initial rolling playback history
      const initialHistory = [
        { filePath: 'demo:track-15', playedAt: Date.now() - 1000 * 60 * 180 },
        { filePath: 'demo:track-11', playedAt: Date.now() - 1000 * 60 * 120 },
        { filePath: 'demo:track-6', playedAt: Date.now() - 1000 * 60 * 90 },
        { filePath: 'demo:track-2', playedAt: Date.now() - 1000 * 60 * 45 },
        { filePath: 'demo:track-1', playedAt: Date.now() - 1000 * 60 * 15 }
      ];
      await this.db.history.bulkAdd(initialHistory);

      // 4. Seed an initial playlist
      await this.db.createPlaylist('Metro Essentials', [
        'demo:track-1',
        'demo:track-6',
        'demo:track-11',
        'demo:track-15',
        'demo:track-20',
        'demo:track-23'
      ]);
    } catch (e) {
      console.warn('Failed to seed demo library:', e);
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

  // In-place track favoriting (0ms latency, no full library reload)
  async toggleTrackHeart(trackId: number, currentHeart: number): Promise<number> {
    const nextHeart = currentHeart === 1 ? 0 : 1;
    await this.db.toggleHeart(trackId, currentHeart);

    // Update in-memory tracks signal in-place
    this.tracks.update(list =>
      list.map(t => t.id === trackId ? { ...t, heart: nextHeart } : t)
    );

    // Update in-memory history signal in-place if present
    this.history.update(list =>
      list.map(t => t.id === trackId ? { ...t, heart: nextHeart } : t)
    );

    return nextHeart;
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

  // Normalize a filesystem path for case/separator-insensitive comparison
  normalizePath(p?: string): string {
    if (!p) return '';
    return p.trim().replace(/[\\/]+$/, '').toLowerCase().replace(/\\/g, '/');
  }

  // Resolve absolute directory path if running in Electron or supported environments
  async resolveDirectoryPath(handle: FileSystemDirectoryHandle): Promise<string | undefined> {
    if (!handle) return undefined;

    // 1. Direct path property if exposed on handle
    if ((handle as any).path && typeof (handle as any).path === 'string') {
      return (handle as any).path;
    }

    // 2. Infer folder path from contained files via Electron webUtils / file.path
    try {
      const getFilePath = (file: File): string => {
        try {
          if ((window as any).electronAPI?.getPathForFile) {
            const p = (window as any).electronAPI.getPathForFile(file);
            if (p) return p;
          }
        } catch {}
        return (file as any)?.path || '';
      };

      const findFirstFile = async (
        dir: any,
        relPath: string,
        depth: number
      ): Promise<{ file: File; relPath: string } | null> => {
        if (depth > 4) return null;
        for await (const entry of dir.values()) {
          const curRel = relPath ? `${relPath}/${entry.name}` : entry.name;
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            return { file, relPath: curRel };
          } else if (entry.kind === 'directory') {
            const nested = await findFirstFile(entry, curRel, depth + 1);
            if (nested) return nested;
          }
        }
        return null;
      };

      const first = await findFirstFile(handle, '', 0);
      if (first) {
        const full = getFilePath(first.file);
        if (full) {
          const isBackslash = full.includes('\\');
          const sep = isBackslash ? '\\' : '/';
          const normalizedRel = isBackslash
            ? first.relPath.replace(/\//g, '\\')
            : first.relPath.replace(/\\/g, '/');

          if (full.endsWith(normalizedRel)) {
            let root = full.slice(0, full.length - normalizedRel.length);
            if (root.endsWith(sep)) {
              root = root.slice(0, -1);
            }
            if (root) return root;
          }
          const lastSep = full.lastIndexOf(sep);
          if (lastSep > 0) {
            return full.substring(0, lastSep);
          }
        }
      }
    } catch (e) {
      // Non-fatal if folder has restricted permissions or no files yet
    }

    return undefined;
  }

  // Pick a new folder and scan it
  async addFolder() {
    try {
      const handle = await (window as any).showDirectoryPicker();
      const pathName = handle.name;
      let folderPath = await this.resolveDirectoryPath(handle);

      const existingFolders = await this.db.folders.toArray();
      let existingFolder: FolderRecord | undefined;

      const normNewPath = this.normalizePath(folderPath);

      // Check if folder is already added: deduplicate on physical path or directory handle identity
      for (const f of existingFolders) {
        // 1. Deduplicate by resolved path if both are known
        if (normNewPath && f.path) {
          if (normNewPath === this.normalizePath(f.path)) {
            existingFolder = f;
            break;
          }
        }

        // 2. Deduplicate by FileSystemHandle entry identity (exact filesystem node match)
        if (f.handle && handle && typeof (handle as any).isSameEntry === 'function') {
          try {
            const isSame = await handle.isSameEntry(f.handle);
            if (isSame) {
              existingFolder = f;
              break;
            }
          } catch {
            // Ignore handle comparison errors if handles are stale
          }
        }
      }

      let folderId: number;
      if (existingFolder) {
        folderId = existingFolder.id!;
        // Update handle and path in case permissions or path refreshed
        await this.db.folders.update(folderId, {
          handle,
          path: folderPath || existingFolder.path,
          pathName: pathName || existingFolder.pathName
        });
      } else {
        folderId = await this.db.folders.add({
          pathName,
          path: folderPath,
          handle,
          lastScanned: 0
        });
      }

      await this.loadLibrary();
      await this.scanFolder(folderId, handle, pathName, folderPath);
    } catch (err) {
      console.error('Error adding folder:', err);
    }
  }

  // Scan folder handle and update DB
  async scanFolder(
    folderId: number,
    handle: FileSystemDirectoryHandle,
    pathName: string,
    knownPath?: string
  ) {
    this.isScanning$.next(true);
    this.scannedCount$.next(0);
    this.totalCount$.next(0);
    this.scanningFolder$.next(pathName);

    let resolvedPath = knownPath;

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
                  // Detect directory root path if not yet known
                  if (!resolvedPath) {
                    const full = ((window as any).electronAPI?.getPathForFile?.(file) || (file as any)?.path || '');
                    if (full) {
                      const isBackslash = full.includes('\\');
                      const sep = isBackslash ? '\\' : '/';
                      const normalizedRel = isBackslash
                        ? entryPath.replace(/\//g, '\\')
                        : entryPath.replace(/\\/g, '/');
                      if (full.endsWith(normalizedRel)) {
                        let root = full.slice(0, full.length - normalizedRel.length);
                        if (root.endsWith(sep)) root = root.slice(0, -1);
                        if (root) resolvedPath = root;
                      } else {
                        const lastSep = full.lastIndexOf(sep);
                        if (lastSep > 0) resolvedPath = full.substring(0, lastSep);
                      }
                      if (resolvedPath) {
                        await this.db.folders.update(folderId, { path: resolvedPath });
                      }
                    }
                  }
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

      // 5. Update last scanned timestamp and path
      const updateData: Partial<FolderRecord> = { lastScanned: Date.now() };
      if (resolvedPath) {
        updateData.path = resolvedPath;
      }
      await this.db.folders.update(folderId, updateData);
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
        await this.scanFolder(folder.id!, folder.handle, folder.pathName, folder.path);
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

  // Lightweight in-memory update for play count without triggering full loadLibrary
  updateTrackPlayCount(trackId: number) {
    this.tracks.update(tracks =>
      tracks.map(t => t.id === trackId ? { ...t, playCount: (t.playCount || 0) + 1 } : t)
    );
  }

  // Get track File/Blob object
  async getTrackFile(track: TrackRecord): Promise<File | Blob> {
    // If it's a built-in public domain demo track, return real audio blob
    if (track.filePath.startsWith('demo:')) {
      return await getDemoTrackAudioBlob(track);
    }

    const folder = await this.db.folders.get(track.folderId);
    if (!folder) {
      throw new Error('Associated folder not found');
    }

    const permitted = await this.verifyPermission(folder.handle);
    if (!permitted) {
      throw new Error(`Permission denied for folder: ${folder.pathName}`);
    }

    // Traverse the relative path (normalize slashes for cross-platform support)
    const normalizedPath = track.filePath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');
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
