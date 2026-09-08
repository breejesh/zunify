<p align="center">
  <img src="doc-images/logo.svg" width="100" height="100" alt="Zunify Logo">
</p>

<h1 align="center">Zunify</h1>
<p align="center"><strong>A Beautiful, Lightweight, Offline-First Zune-Inspired Cross-Platform Desktop Music Player & Product Showcase</strong></p>

<p align="center">
  <strong>Bring back the nostalgia of the late-2000s Zune Metro UI to your desktop.</strong><br>
  Synchronize your local music collection directly—zero cloud uploads, zero accounts, zero trackers, and 100% offline-ready.
</p>

<p align="center">
  <a href="#zunify"><img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-FF5000?style=flat-square" alt="Platform"></a>
  <a href="#zunify"><img src="https://img.shields.io/badge/Desktop-Electron-47848F?style=flat-square&logo=electron" alt="Electron"></a>
  <a href="#zunify"><img src="https://img.shields.io/badge/Angular-19.0-DD0031?style=flat-square&logo=angular" alt="Angular"></a>
  <a href="#zunify"><img src="https://img.shields.io/badge/Database-IndexedDB%20%2F%20Dexie-00a2e8?style=flat-square" alt="Database"></a>
  <a href="#zunify"><img src="https://img.shields.io/badge/Privacy-100%25%20Offline-15803D?style=flat-square" alt="Privacy First"></a>
</p>

---

## 📁 Repository Structure

This repository is organized into two primary projects:

```text
zunify/
├── player/            # Full-fledged Cross-Platform Electron Desktop Music Player
│   ├── electron/      # Electron main and preload bridge scripts
│   ├── src/           # Angular 19 reactive UI with Zune Metro design
│   ├── dist-desktop/  # Built desktop installers and executables
│   └── package.json   # Desktop player dependencies and electron-builder config
│
├── website/           # Official Modern Product Showcase Landing Website
│   ├── index.html     # Semantic landing page with auto OS-detecting downloads
│   ├── styles.css     # Zune design system, radiant glows, and glassmorphism
│   ├── app.js         # Interactive demo player with Web Audio synthesizer
│   └── doc-images/    # High-resolution screenshots and assets
│
└── package.json       # Root orchestration scripts
```

---

## 🚀 Quick Start

### 1. Desktop Player (`player/`)
To run the desktop player in development (Angular dev server + Electron live):
```bash
npm run dev:player
```
Or directly inside `player/`:
```bash
cd player
npm start            # Start Angular dev server on localhost:4200
npm run electron     # Launch Electron desktop window
```

To build production desktop packages (`.exe` for Windows, `.dmg` for macOS, `.AppImage` for Linux):
```bash
npm run dist:desktop       # Build for current OS
npm run dist:win           # Build Windows installer & portable
npm run dist:mac           # Build macOS DMG
npm run dist:linux         # Build Linux AppImage & .deb
```

The packaged executables will be generated in `player/dist-desktop/`.

---

### 2. Product Landing Website (`website/`)
To preview the product landing website locally:
```bash
npm run dev:website
```
Or use any static server:
```bash
npx serve website -p 3000
```
Open your browser at `http://localhost:3000` to interact with:
- **Smart OS Detection**: Detects your operating system and customizes the primary download button.
- **Embedded Interactive Web Demo**: Play synthesized retro ambient tracks with real audio, test the dynamic album color bloom, and switch views.
- **Accent Switcher**: Preview the player and website in Magenta, Orange, Cyan, Green, or Purple.
- **Visual Tour Gallery**: Inspect high-res screenshots of every player hub.

To deploy the product landing website to Firebase Hosting:
```bash
npm run deploy:website
```

---

## 🎧 Desktop Player Key Features

- **100% Offline-First & Private:** Scans local directories directly. No audio or listening habits ever leave your machine.
- **Iconic Zune Metro UI:** Minimalist typography, fluid animations, high-contrast layouts, and horizontal pivot navigation.
- **Dynamic Ambient Color Bloom:** Fullscreen Now Playing screen shifts its ambient background to mirror current album art colors.
- **Native Desktop Power:** Frameless window with custom Zune minimize/maximize/close buttons, draggable top header, and global keyboard media keys (`Play/Pause`, `Next`, `Prev`).
- **Comprehensive Audio Codec Support:** FLAC, MP3, WAV, M4A, AAC, and OGG with instant embedded ID3 tag extraction.
- **Favorites & Playlists:** Heart rating system and local offline playlist manager.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
