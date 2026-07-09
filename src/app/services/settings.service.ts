import { Injectable, signal } from '@angular/core';

export type ZuneTheme = 'dark' | 'light' | 'original';
export type ZuneAccent = 'orange' | 'magenta' | 'cyan' | 'green' | 'red' | 'yellow';
export type ZunifyView = 'quickplay' | 'collection' | 'marketplace' | 'social' | 'settings' | 'nowplaying';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  theme = signal<ZuneTheme>('original');
  accentColor = signal<ZuneAccent>('magenta');
  currentView = signal<ZunifyView>('quickplay');

  constructor() {
    this.loadSettings();
  }

  loadSettings() {
    const t = localStorage.getItem('zunify-theme') as ZuneTheme;
    const a = localStorage.getItem('zunify-accent') as ZuneAccent;
    if (t) this.theme.set(t);
    if (a) this.accentColor.set(a);
    this.applyStyles();
  }

  setTheme(t: ZuneTheme) {
    this.theme.set(t);
    localStorage.setItem('zunify-theme', t);
    this.applyStyles();
  }

  setAccent(a: ZuneAccent) {
    this.accentColor.set(a);
    localStorage.setItem('zunify-accent', a);
    this.applyStyles();
  }

  setView(v: ZunifyView) {
    this.currentView.set(v);
    this.applyStyles();
  }

  applyStyles() {
    const root = document.documentElement;
    
    const isDarkTheme = this.theme() === 'dark';
    const isOriginalThemeDarkView = this.theme() === 'original' && this.currentView() !== 'collection' && this.currentView() !== 'settings';
    const isDark = isDarkTheme || isOriginalThemeDarkView;

    // Theme colors
    if (isDark) {
      root.style.setProperty('--bg-color', '#101010');
      root.style.setProperty('--bg-secondary', '#1a1a1a');
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--text-secondary', '#aaaaaa');
      root.style.setProperty('--border-color', '#1c1c1c');
      root.style.setProperty('--hover-color', '#222222');
      root.style.setProperty('--panel-bg', 'rgba(16, 16, 16, 0.7)');
    } else {
      root.style.setProperty('--bg-color', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f4f4f4');
      root.style.setProperty('--text-color', '#000000');
      root.style.setProperty('--text-secondary', '#777777');
      root.style.setProperty('--border-color', '#efefef');
      root.style.setProperty('--hover-color', '#eeeeee');
      root.style.setProperty('--panel-bg', 'rgba(255, 255, 255, 0.7)');
    }

    // Accent colors
    let accentHex = '#e5007d'; // magenta default
    let accentRgb = '229, 0, 125';
    switch (this.accentColor()) {
      case 'orange':
        accentHex = '#ff5000';
        accentRgb = '255, 80, 0';
        break;
      case 'magenta':
        accentHex = '#e5007d';
        accentRgb = '229, 0, 125';
        break;
      case 'cyan':
        accentHex = '#00a2e8';
        accentRgb = '0, 162, 232';
        break;
      case 'green':
        accentHex = '#8cbf26';
        accentRgb = '140, 191, 38';
        break;
      case 'red':
        accentHex = '#e50914';
        accentRgb = '229, 9, 20';
        break;
      case 'yellow':
        accentHex = '#ffb900';
        accentRgb = '255, 185, 0';
        break;
    }

    root.style.setProperty('--accent-color', accentHex);
    root.style.setProperty('--accent-color-rgb', accentRgb);

    // Update PWA desktop app window title bar color via meta tag
    if (typeof document !== 'undefined') {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        if (isDark) {
          meta.setAttribute('content', '#101010');
        } else {
          meta.setAttribute('content', '#ffffff');
        }
      }

      // Update browser tab icon to match Zune accent color
      const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (faviconLink) {
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="none" stroke="${accentHex}" stroke-width="1.5" /><text x="16" y="21.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="300" font-size="16" fill="${accentHex}" text-anchor="middle">Z</text></svg>`;
        faviconLink.href = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
      }
    }
  }
}
