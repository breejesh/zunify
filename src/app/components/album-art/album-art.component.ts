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

  private async loadArt() {
    this.cleanupUrl();

    if (!this.artKey) {
      this.artUrl.set(null);
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
