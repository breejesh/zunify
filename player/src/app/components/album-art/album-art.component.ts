import { Component, Input, OnChanges, SimpleChanges, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DbService } from '../../services/db.service';

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

  private getDemoCover(key: string): string | null {
    const k = key.toLowerCase();
    if (AlbumArtComponent.DEMO_ART_MAP[k]) return AlbumArtComponent.DEMO_ART_MAP[k];
    if (k.includes('metro') || k.includes('zune')) return 'assets/covers/metro_nights.jpg';
    if (k.includes('analog') || k.includes('velvet')) return 'assets/covers/analog_dreams.jpg';
    if (k.includes('chopin') || k.includes('nocturne')) return 'assets/covers/chopin_nocturnes.jpg';
    if (k.includes('debussy') || k.includes('horizon')) return 'assets/covers/debussy_horizons.jpg';
    if (k.includes('joplin') || k.includes('ragtime')) return 'assets/covers/ragtime_classics.jpg';
    if (k.includes('cyber') || k.includes('subtle') || k.includes('flux')) return 'assets/covers/cyber_pulse.jpg';
    return null;
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
