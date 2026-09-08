import { Injectable, signal } from '@angular/core';

export interface ModalConfig {
  type: 'confirm-delete' | 'add-to-playlist' | 'save-playlist' | 'edit-playlist' | 'confirm-reset';
  title: string;
  description?: string;
  // For confirm dialogs
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  activeModal = signal<ModalConfig | null>(null);

  open(config: ModalConfig) {
    this.activeModal.set(config);
  }

  close() {
    this.activeModal.set(null);
  }

  confirm() {
    const m = this.activeModal();
    if (m?.onConfirm) m.onConfirm();
    this.close();
  }

  cancel() {
    const m = this.activeModal();
    if (m?.onCancel) m.onCancel();
    this.close();
  }
}
