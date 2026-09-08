import { Component, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibraryService } from '../../services/library.service';
import { SettingsService, ZuneTheme, ZuneAccent } from '../../services/settings.service';
import { DbService } from '../../services/db.service';
import { AudioService } from '../../services/audio.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
  progressPercent = computed(() => {
    const total = this.libraryService.totalCount$.value;
    const scanned = this.libraryService.scannedCount$.value;
    return total > 0 ? (scanned / total) * 100 : 0;
  });

  trackByFolderId(index: number, folder: any) {
    return folder.id || folder.path || index;
  }

  constructor(
    public libraryService: LibraryService,
    public settingsService: SettingsService,
    private db: DbService,
    private audio: AudioService,
    private modalService: ModalService
  ) {}

  confirmClear() {
    this.modalService.open({
      type: 'confirm-reset',
      title: 'reset library',
      description: 'are you sure you want to reset the library database? this will clear all folders and tracks from Zunify.',
      confirmLabel: 'reset',
      cancelLabel: 'cancel',
      onConfirm: async () => {
        this.audio.pause();
        this.audio.currentTrack.set(null);
        this.audio.queue.set([]);
        this.audio.currentIndex.set(-1);
        
        this.settingsService.setTheme('original');
        this.settingsService.setAccent('magenta');
        
        await this.db.clearAllData();
        await this.libraryService.loadLibrary();
      }
    });
  }
}
