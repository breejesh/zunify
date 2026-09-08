import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LibraryService } from '../../services/library.service';
import { AudioService } from '../../services/audio.service';
import { TrackRecord, DbService, PlaylistRecord } from '../../services/db.service';
import { AlbumArtComponent } from '../album-art/album-art.component';
import { PlaylistModalService } from '../../services/playlist-modal.service';

export type ArtistSortOption = 'az' | 'za' | 'tracks';
export type AlbumSortOption = 'az' | 'za' | 'year';
export type SongSortOption = 'trackno' | 'az' | 'za' | 'duration' | 'plays';

@Component({
  selector: 'app-collection',
  standalone: true,
  imports: [CommonModule, FormsModule, AlbumArtComponent],
  templateUrl: './collection.component.html',
  styleUrl: './collection.component.css'
})
export class CollectionComponent implements OnInit {
  // Independent Column states using Signals
  artistSearch = signal('');
  artistSort = signal<ArtistSortOption>('az');

  albumSearch = signal('');
  albumSort = signal<AlbumSortOption>('az');

  songSearch = signal('');
  songSort = signal<SongSortOption>('trackno');

  selectedArtist = signal<string | null>(null);
  selectedAlbum = signal<string | null>(null);

  showArtistSortDropdown = signal(false);
  showAlbumSortDropdown = signal(false);
  showSongSortDropdown = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.showArtistSortDropdown.set(false);
    this.showAlbumSortDropdown.set(false);
    this.showSongSortDropdown.set(false);
  }

  toggleArtistSort(event: Event) {
    event.stopPropagation();
    const current = this.showArtistSortDropdown();
    this.showArtistSortDropdown.set(!current);
    this.showAlbumSortDropdown.set(false);
    this.showSongSortDropdown.set(false);
  }

  toggleAlbumSort(event: Event) {
    event.stopPropagation();
    const current = this.showAlbumSortDropdown();
    this.showAlbumSortDropdown.set(!current);
    this.showArtistSortDropdown.set(false);
    this.showSongSortDropdown.set(false);
  }

  toggleSongSort(event: Event) {
    event.stopPropagation();
    const current = this.showSongSortDropdown();
    this.showSongSortDropdown.set(!current);
    this.showArtistSortDropdown.set(false);
    this.showAlbumSortDropdown.set(false);
  }

  setArtistSort(val: string, event: Event) {
    event.stopPropagation();
    this.artistSort.set(val as any);
    this.showArtistSortDropdown.set(false);
  }

  setAlbumSort(val: string, event: Event) {
    event.stopPropagation();
    this.albumSort.set(val as any);
    this.showAlbumSortDropdown.set(false);
  }

  setSongSort(val: string, event: Event) {
    event.stopPropagation();
    this.songSort.set(val as any);
    this.showSongSortDropdown.set(false);
  }

  getArtistSortLabel(): string {
    const val = this.artistSort();
    if (val === 'az') return 'a-z';
    if (val === 'za') return 'z-a';
    if (val === 'tracks') return 'tracks';
    return val;
  }

  getAlbumSortLabel(): string {
    const val = this.albumSort();
    if (val === 'az') return 'a-z';
    if (val === 'za') return 'z-a';
    if (val === 'year') return 'year';
    return val;
  }

  getSongSortLabel(): string {
    const val = this.songSort();
    if (val === 'trackno') return 'track no';
    if (val === 'az') return 'a-z';
    if (val === 'za') return 'z-a';
    if (val === 'duration') return 'length';
    if (val === 'plays') return 'plays';
    return val;
  }

  constructor(
    public libraryService: LibraryService,
    public audioService: AudioService,
    public playlistModal: PlaylistModalService,
    private db: DbService
  ) { }

  ngOnInit() {
    this.selectArtist(null);
  }

  selectArtist(artist: string | null) {
    this.selectedArtist.set(artist);
    this.selectedAlbum.set(null); // Reset album filter when artist changes
  }

  selectAlbum(album: string | null) {
    this.selectedAlbum.set(album);
  }

  // Filtered and Sorted Artists List
  filteredArtists = computed(() => {
    const tracks = this.libraryService.tracks();
    const query = this.artistSearch().toLowerCase().trim();

    // 1. Extract unique artist names and track counts
    const artistCounts = new Map<string, number>();
    tracks.forEach(track => {
      // Filter by search query
      if (query && !track.artist.toLowerCase().includes(query)) return;
      artistCounts.set(track.artist, (artistCounts.get(track.artist) || 0) + 1);
    });

    const artists = Array.from(artistCounts.keys());

    // 2. Apply sorting
    if (this.artistSort() === 'az') {
      return artists.sort((a, b) => a.localeCompare(b));
    } else if (this.artistSort() === 'za') {
      return artists.sort((a, b) => b.localeCompare(a));
    } else if (this.artistSort() === 'tracks') {
      return artists.sort((a, b) => (artistCounts.get(b) || 0) - (artistCounts.get(a) || 0));
    }

    return artists.sort((a, b) => a.localeCompare(b));
  });

  // Filtered and Sorted Albums List
  filteredAlbums = computed(() => {
    const tracks = this.libraryService.tracks();
    const artist = this.selectedArtist();
    const query = this.albumSearch().toLowerCase().trim();

    // 1. Gather albums and map their tracks
    const albumsMap = new Map<string, { name: string; artist: string; artKey?: string; year?: number; dateAdded?: number }>();

    tracks.forEach(track => {
      // Filter by selected artist
      if (artist && track.artist !== artist) return;

      // Filter by search query
      if (query && !track.album.toLowerCase().includes(query)) return;

      const key = `${track.artist} - ${track.album}`.toLowerCase();
      if (!albumsMap.has(key)) {
        albumsMap.set(key, {
          name: track.album,
          artist: track.artist,
          artKey: track.albumArtKey,
          year: track.year || 0,
          dateAdded: track.id || 0 // Use DB incrementing ID as dateAdded proxy
        });
      }
    });

    const albums = Array.from(albumsMap.values());

    // 2. Apply sorting
    if (this.albumSort() === 'az') {
      return albums.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.albumSort() === 'za') {
      return albums.sort((a, b) => b.name.localeCompare(a.name));
    } else if (this.albumSort() === 'year') {
      return albums.sort((a, b) => (b.year || 0) - (a.year || 0));
    }

    return albums.sort((a, b) => a.name.localeCompare(b.name));
  });

  // Filtered and Sorted Songs List
  filteredSongs = computed(() => {
    const tracks = this.libraryService.tracks();
    const artist = this.selectedArtist();
    const album = this.selectedAlbum();
    const query = this.songSearch().toLowerCase().trim();

    // 1. Filter tracks
    let songs = tracks.filter(track => {
      // Filter by selected artist
      if (artist && track.artist !== artist) return false;

      // Filter by selected album
      if (album && track.album !== album) return false;

      // Filter by search query
      if (query && !track.title.toLowerCase().includes(query)) return false;

      return true;
    });

    // 2. Apply sorting
    songs.sort((a, b) => {
      switch (this.songSort()) {
        case 'trackno':
          // Sort by album, then track number
          if (a.album !== b.album) return a.album.localeCompare(b.album);
          return (a.trackNumber || 0) - (b.trackNumber || 0);
        case 'az':
          return a.title.localeCompare(b.title);
        case 'za':
          return b.title.localeCompare(a.title);
        case 'duration':
          return b.duration - a.duration;
        case 'plays':
          return b.playCount - a.playCount;
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return songs;
  });

  async toggleHeart(track: TrackRecord, event: Event) {
    event.stopPropagation();
    if (track.id) {
      await this.db.toggleHeart(track.id, track.heart);
      await this.libraryService.loadLibrary(); // reload
    }
  }

  playTrack(track: TrackRecord) {
    // Play track and load the current list of filtered songs as the playback queue!
    this.audioService.playTrack(track, this.filteredSongs());
  }

  formatDuration(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  openAddPlaylistModal(event: Event, track: TrackRecord) {
    event.stopPropagation();
    this.playlistModal.open(track);
  }
}
