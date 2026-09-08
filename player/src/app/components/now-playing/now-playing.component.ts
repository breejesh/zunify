import { Component, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioService } from '../../services/audio.service';
import { SettingsService } from '../../services/settings.service';
import { LibraryService } from '../../services/library.service';
import { PlaylistModalService } from '../../services/playlist-modal.service';
import { TrackRecord, DbService, PlaylistRecord } from '../../services/db.service';
import { AlbumArtComponent } from '../album-art/album-art.component';

interface CollageCell {
  id: number;
  artKey: string;
  colSpan: number;
  rowSpan: number;
  flipping: boolean;
}

@Component({
  selector: 'app-now-playing',
  standalone: true,
  imports: [CommonModule, AlbumArtComponent, FormsModule],
  templateUrl: './now-playing.component.html',
  styleUrl: './now-playing.component.css'
})
export class NowPlayingComponent implements OnInit, OnDestroy {
  progressPercent = computed(() => {
    const cur = this.audioService.currentTime();
    const dur = this.audioService.duration();
    return dur > 0 ? (cur / dur) * 100 : 0;
  });

  currentVolume = computed(() => this.audioService.volume());

  remainingTime = computed(() => {
    const cur = this.audioService.currentTime();
    const dur = this.audioService.duration();
    return Math.max(0, dur - cur);
  });

  activeIdx = computed(() => this.audioService.currentIndex());
  queueLength = computed(() => this.audioService.queue().length);

  // Collage cell structures
  collageCells = signal<CollageCell[]>([]);

  showSuccessToast = signal<boolean>(false);
  successToastMessage = signal<string>('');

  // Custom Visualizer Heights
  vizHeights = signal<number[]>(Array(24).fill(2));

  // SVG screen-bleed path — shape grows upward from bottom
  vizPath = computed(() => {
    const heights = this.vizHeights();
    const count = heights.length;
    if (count === 0) return '';
    const w = count * 10;
    const svgH = 30;
    // Points along the top edge of the bleed shape
    const points = heights.map((val, i) => ({
      x: i * 10 + 5,
      y: svgH - val
    }));
    // Start at bottom-left, go to first top point
    let d = `M 0 ${svgH} L 0 ${points[0].y}`;
    // Smooth curve across top edge
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    // Close to bottom-right
    d += ` L ${w} ${svgH} Z`;
    return d;
  });

  private flipIntervalId: any;
  private vizIntervalId: any;

  constructor(
    public audioService: AudioService,
    public settingsService: SettingsService,
    public libraryService: LibraryService,
    public playlistModal: PlaylistModalService,
    private db: DbService
  ) { }

  ngOnInit() {
    this.buildCollageGrid();
    this.startCellRotation();
    this.startVisualizerAnimation();
  }

  ngOnDestroy() {
    if (this.flipIntervalId) clearInterval(this.flipIntervalId);
    if (this.vizIntervalId) clearInterval(this.vizIntervalId);
  }

  buildCollageGrid() {
    const tracks = this.libraryService.tracks();
    const artKeys = tracks
      .map(t => t.albumArtKey)
      .filter((k): k is string => k !== undefined && k !== '');
    const uniqueKeys = Array.from(new Set(artKeys));

    // Shuffle album art keys
    const shuffledKeys = [...uniqueKeys].sort(() => Math.random() - 0.5);

    const patterns = [
      { colSpan: 2, rowSpan: 2 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 2, rowSpan: 1 },
      { colSpan: 1, rowSpan: 2 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 2, rowSpan: 2 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 2, rowSpan: 1 },
      { colSpan: 1, rowSpan: 2 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 2, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 2, rowSpan: 2 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 2, rowSpan: 1 },
      { colSpan: 1, rowSpan: 2 },
    ];

    // Shuffle patterns
    const shuffledPatterns = [...patterns].sort(() => Math.random() - 0.5);

    const cells: CollageCell[] = [];
    const totalCellsNeeded = 36;

    for (let i = 0; i < totalCellsNeeded; i++) {
      const pattern = shuffledPatterns[i % shuffledPatterns.length];
      let selectedArt = '';
      if (shuffledKeys.length > 0) {
        if (i < shuffledKeys.length) {
          selectedArt = shuffledKeys[i];
        } else {
          selectedArt = shuffledKeys[Math.floor(Math.random() * shuffledKeys.length)];
        }
      }
      cells.push({
        id: i,
        artKey: selectedArt,
        colSpan: pattern.colSpan,
        rowSpan: pattern.rowSpan,
        flipping: false
      });
    }
    this.collageCells.set(cells);
  }

  startCellRotation() {
    this.flipIntervalId = setInterval(() => {
      const currentCells = this.collageCells();
      if (currentCells.length === 0) return;

      const tracks = this.libraryService.tracks();
      const artKeys = tracks
        .map(t => t.albumArtKey)
        .filter((k): k is string => k !== undefined && k !== '');
      const uniqueKeys = Array.from(new Set(artKeys));
      if (uniqueKeys.length === 0) return;

      // Pick 2 random non-flipping cells
      const candidates = currentCells
        .map((c, i) => ({ cell: c, index: i }))
        .filter(c => !c.cell.flipping);
      const countToFlip = Math.min(candidates.length, 2);
      const indicesToFlip: number[] = [];
      while (indicesToFlip.length < countToFlip && candidates.length > 0) {
        const pick = Math.floor(Math.random() * candidates.length);
        indicesToFlip.push(candidates[pick].index);
        candidates.splice(pick, 1);
      }

      // Step 1: Set flipping = true
      const flippingCells = [...currentCells];
      indicesToFlip.forEach(idx => {
        flippingCells[idx] = { ...flippingCells[idx], flipping: true };
      });
      this.collageCells.set(flippingCells);

      // Step 2: Swap art midway through the flip
      setTimeout(() => {
        const midCells = [...this.collageCells()];
        indicesToFlip.forEach(idx => {
          const newArt = uniqueKeys[Math.floor(Math.random() * uniqueKeys.length)];
          midCells[idx] = { ...midCells[idx], artKey: newArt };
        });
        this.collageCells.set(midCells);
      }, 300);

      // Step 3: Unflip after animation completes
      setTimeout(() => {
        const doneCells = [...this.collageCells()];
        indicesToFlip.forEach(idx => {
          doneCells[idx] = { ...doneCells[idx], flipping: false };
        });
        this.collageCells.set(doneCells);
      }, 700);
    }, 4000);
  }

  startVisualizerAnimation() {
    this.vizIntervalId = setInterval(() => {
      const isPlaying = this.audioService.isPlaying();
      const count = 24;
      const prev = this.vizHeights();
      const heights: number[] = [];
      for (let i = 0; i < count; i++) {
        // Mountain envelope: 0 at edges, 1.0 at center (narrow spread)
        const t = i / (count - 1); // 0..1
        let envelope: number;
        if (t < 0.35) {
          envelope = t / 0.35; // ramp up from 0 to 1 in first 35%
        } else if (t > 0.65) {
          envelope = (1 - t) / 0.35; // ramp down from 1 to 0 in last 35%
        } else {
          envelope = 1.0; // full height in center 30%
        }
        // Apply smooth easing to the envelope
        envelope = envelope * envelope * (3 - 2 * envelope);

        if (isPlaying) {
          const target = Math.floor(Math.random() * 8) + 2;
          const old = prev[i] ?? 0;
          const raw = Math.round(old + (target - old) * 0.4);
          heights.push(Math.round(raw * envelope));
        } else {
          heights.push(0);
        }
      }
      this.vizHeights.set(heights);
    }, 180);
  }

  trackCellById(index: number, item: CollageCell): number {
    return item.id;
  }

  playQueueItem(track: TrackRecord, index: number) {
    this.audioService.playQueueIndex(index);
  }

  seekTo(event: MouseEvent) {
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percent = clickX / rect.width;
    const duration = this.audioService.duration();
    if (duration > 0) {
      this.audioService.seek(percent * duration);
    }
  }

  async toggleHeart(track: TrackRecord) {
    if (track.id) {
      const currentVal = track.heart;
      const nextVal = currentVal === 1 ? 0 : 1;
      await this.db.toggleHeart(track.id, currentVal);
      await this.libraryService.loadLibrary();
      const refreshed = await this.db.getTrackById(track.id);
      if (refreshed) {
        this.audioService.currentTrack.set(refreshed);
      }
    }
  }

  formatTime(seconds: number | null): string {
    if (seconds === null || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  saveAsPlaylist() {
    const queue = this.audioService.queue();
    if (queue.length === 0) {
      this.showToast('queue is empty!');
      return;
    }
    const paths = queue.map(t => t.filePath).filter(p => !!p);
    this.playlistModal.openSaveQueue(paths);
  }

  private showToast(msg: string) {
    this.successToastMessage.set(msg);
    this.showSuccessToast.set(true);
    setTimeout(() => {
      this.showSuccessToast.set(false);
    }, 3000);
  }

  openAddPlaylistModal(event: Event, track: TrackRecord) {
    event.stopPropagation();
    this.playlistModal.open(track);
  }

  goBack() {
    this.settingsService.setView('collection');
  }

  toggleShuffle() {
    this.audioService.toggleShuffle();
  }

  toggleRepeat() {
    this.audioService.toggleRepeat();
    const mode = this.audioService.repeat();
    const label = mode === 'off' ? 'repeat: off' : (mode === 'all' ? 'repeat: all' : 'repeat: one');
    this.showToast(label);
  }

  prev() {
    this.audioService.prev();
  }

  next() {
    this.audioService.next();
  }

  togglePlay() {
    this.audioService.togglePlay();
  }

  isPlaying() {
    return this.audioService.isPlaying();
  }

  toggleMute() {
    this.audioService.toggleMute();
  }

  onVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.audioService.setVolume(Number(input.value));
  }
}
