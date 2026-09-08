import { Component, Input, OnChanges, OnDestroy, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DbService } from '../../services/db.service';

@Component({
  selector: 'app-album-art',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './album-art.component.html',
  styleUrl: './album-art.component.css'
})
export class AlbumArtComponent implements OnChanges, OnDestroy {
  @Input() artKey?: string;
  
  artUrl = signal<string | null>(null);
  private currentUrl: string | null = null;

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
    'subtle flux - cybernetic pulse': 'assets/covers/cyber_pulse.jpg',
    'solara ray - fragments': 'assets/covers/cover_2.jpg',
    'ryan jones - artistic echoes': 'assets/covers/cover_3.jpg',
    'sebastian vale - night drive': 'assets/covers/cover_4.jpg',
    'joy fabiani - piano jazz nights': 'assets/covers/cover_5.jpg',
    'michael howard - blue inception': 'assets/covers/cover_6.jpg',
    'sophia fish - electric wave': 'assets/covers/cover_7.jpg',
    'samantha rhodes - phantom diva': 'assets/covers/cover_8.jpg',
    'jeanne lebras - the stranger inside': 'assets/covers/cover_9.jpg',
    'paul smith - love song': 'assets/covers/cover_10.jpg',
    'tape archive - maroon noise': 'assets/covers/cover_13.jpg'
  };

  private getDemoCover(key: string): string | null {
    const k = key.toLowerCase();
    if (AlbumArtComponent.DEMO_ART_MAP[k]) return AlbumArtComponent.DEMO_ART_MAP[k];
    if (k.includes('fragments') || k.includes('solara')) return 'assets/covers/cover_2.jpg';
    if (k.includes('artistic') || k.includes('ryan')) return 'assets/covers/cover_3.jpg';
    if (k.includes('night drive') || k.includes('sebastian')) return 'assets/covers/cover_4.jpg';
    if (k.includes('piano jazz') || k.includes('fabiani')) return 'assets/covers/cover_5.jpg';
    if (k.includes('inception') || k.includes('howard')) return 'assets/covers/cover_6.jpg';
    if (k.includes('electric wave') || k.includes('sophia')) return 'assets/covers/cover_7.jpg';
    if (k.includes('phantom') || k.includes('rhodes')) return 'assets/covers/cover_8.jpg';
    if (k.includes('stranger') || k.includes('lebras')) return 'assets/covers/cover_9.jpg';
    if (k.includes('love song') || k.includes('paul')) return 'assets/covers/cover_10.jpg';
    if (k.includes('maroon') || k.includes('tape')) return 'assets/covers/cover_13.jpg';
    if (k.includes('metro') || k.includes('zune')) return 'assets/covers/metro_nights.jpg';
    if (k.includes('analog') || k.includes('velvet')) return 'assets/covers/analog_dreams.jpg';
    if (k.includes('chopin') || k.includes('nocturne')) return 'assets/covers/chopin_nocturnes.jpg';
    if (k.includes('debussy') || k.includes('horizon')) return 'assets/covers/debussy_horizons.jpg';
    if (k.includes('joplin') || k.includes('ragtime')) return 'assets/covers/ragtime_classics.jpg';
    if (k.includes('cyber') || k.includes('subtle') || k.includes('flux')) return 'assets/covers/cyber_pulse.jpg';
    return null;
  }

  private async loadArt() {
    this.cleanupUrl();

    if (!this.artKey) {
      this.artUrl.set(null);
      return;
    }

    const demoArt = this.getDemoCover(this.artKey);
    if (demoArt) {
      this.artUrl.set(demoArt);
      return;
    }

    try {
      const artRecord = await this.db.getAlbumArt(this.artKey);
      if (artRecord && artRecord.blob) {
        this.currentUrl = URL.createObjectURL(artRecord.blob);
        this.artUrl.set(this.currentUrl);
      } else {
        this.artUrl.set(null);
      }
    } catch (e) {
      console.warn('Failed to load album art:', e);
      this.artUrl.set(null);
    }
  }

  onImgError() {
    this.artUrl.set(null);
  }

  private cleanupUrl() {
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
  }

  ngOnDestroy() {
    this.cleanupUrl();
  }
}
