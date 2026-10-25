import { Component, Input, OnChanges, SimpleChanges, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DbService } from '../../services/db.service';
import { isDesktopApp } from '../../services/library.service';

@Component({
  selector: 'app-album-art',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './album-art.component.html',
  styleUrl: './album-art.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlbumArtComponent implements OnChanges {
  @Input() artKey?: string;
  
  artUrl = signal<string | null>(null);

  constructor(private db: DbService) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['artKey']) {
      await this.loadArt();
    }
  }

  private static readonly DEMO_ART_MAP: Record<string, string> = {
    'zune collective - metro nights': 'assets/covers/metro_nights.jpg',
    'velvet drive - analog dreams': 'assets/covers/analog_dreams.jpg',
    'frédéric chopin - nocturnes & classics': 'assets/covers/chopin_nocturnes.jpg',
    'frederic chopin - nocturnes & classics': 'assets/covers/chopin_nocturnes.jpg',
    'claude debussy - impressionist horizons': 'assets/covers/debussy_horizons.jpg',
    'scott joplin - golden era ragtime': 'assets/covers/ragtime_classics.jpg',
    'subtle flux - cybernetic pulse': 'assets/covers/cyber_pulse.jpg'
  };

  // Exact-match only: real albums whose names merely contain words like "metro"
  // must keep their own embedded artwork. Demo covers are not shipped with the desktop app.
  private getDemoCover(key: string): string | null {
    if (isDesktopApp()) return null;
    return AlbumArtComponent.DEMO_ART_MAP[key.toLowerCase()] ?? null;
  }

  private async loadArt() {
    if (!this.artKey) {
      this.artUrl.set(null);
      return;
    }

    const demoArt = this.getDemoCover(this.artKey);
    if (demoArt) {
      this.artUrl.set(demoArt);
      return;
    }

    const url = await this.db.getAlbumArtUrl(this.artKey);
    this.artUrl.set(url);
  }

  onImgError() {
    this.artUrl.set(null);
  }
}
