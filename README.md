<p align="center">
  <img src="doc-images/logo.svg" width="100" height="100" alt="Zunify Logo">
</p>

<h1 align="center">Zunify</h1>
<p align="center"><strong>A Beautiful, Lightweight, Offline-First Zune-Inspired Music Player</strong></p>

<p align="center">
  <strong>Bring back the nostalgia of the late-2000s Zune Metro UI to your web browser.</strong><br>
  Synchronize your local music collection directly via the File System Access API—zero server uploads, zero accounts, zero trackers, and 100% offline-ready.
</p>

<p align="center">
  <a href="#zunify"><img src="https://img.shields.io/badge/Platform-PWA%20%2F%20Web-FF5000?style=flat-square" alt="Platform"></a>
  <a href="#zunify"><img src="https://img.shields.io/badge/Angular-19.0-DD0031?style=flat-square&logo=angular" alt="Angular"></a>
  <a href="#zunify"><img src="https://img.shields.io/badge/Database-IndexedDB%20%2F%20Dexie-00a2e8?style=flat-square" alt="Database"></a>
  <a href="#zunify"><img src="https://img.shields.io/badge/Metadata-music--metadata--browser-8cbf26?style=flat-square" alt="Metadata"></a>
  <a href="#zunify"><img src="https://img.shields.io/badge/Privacy-100%25%20Offline-15803D?style=flat-square" alt="Privacy First"></a>
</p>

<p align="center">
  <a href="https://zunify.breejeshrathod.com/" target="_blank">
    <img src="https://img.shields.io/badge/🚀%20Live%20Demo-Launch%20Zunify-FF5000?style=for-the-badge" alt="Live Demo">
  </a>
</p>

---

### Why Zunify?

Most modern music players require bloated accounts, premium monthly subscriptions, tracking telemetry, or constant internet connectivity.

**Zunify is the antidote.** Inspired by the iconic design language of the original Microsoft Zune, it is built on three core pillars:

- **100% Offline-First & Private:** Zunify uses the browser's native **File System Access API** and **IndexedDB** (via Dexie.js). You authorize a local music directory, and Zunify scans, extracts tags, and plays files directly from your disk on-device. No files are ever uploaded, and no listening data ever leaves your browser.
- **Iconic Zune Aesthetics:** A faithful reimagining of the Zune "Metro" interface. Minimalist layouts, typography-first hierarchy, high-contrast menus, and dynamic background artwork.
- **Zero Logins, Zero Telemetry:** There are no sign-up forms, no email collection, and no backend tracking servers. Just open the app and listen to your music.
- **Progressive Web App (PWA):** Install it as a standalone app on your desktop, macOS, or Android/iOS device. Play your local music even without internet access.

---

### Gallery & Showcase

Here is a look at Zunify in action, highlighting its beautiful styling:

#### 1. Home / Quickplay Hub
The starting screen provides rapid access to your playback history, most-played tracks, and favorited songs.
<p align="center">
  <img src="doc-images/home.png" width="90%" alt="Zunify Home Screen">
</p>

#### 2. The Music Collection
Browse all imported tracks grouped by artists, albums, or search terms, and construct custom playlists.
<p align="center">
  <img src="doc-images/collection.png" width="90%" alt="Zunify Collection Screen">
</p>

#### 3. Now Playing (Immersive Mode)
Immerse yourself in a full-screen, typography-first visualization of your active track. The layout scales beautifully, featuring dynamic ambient backdrops that shift and morph to match the colors of the current album art.
<p align="center">
  <img src="doc-images/now-playing-1.png" width="90%" alt="Zunify Now Playing View - Main">
  <br><br>
  <img src="doc-images/now-playing-2.png" width="90%" alt="Zunify Now Playing View - Accent Showcase">
</p>

#### 4. Settings & Customization
Tailor the player to your style. Switch themes between Dark, Light, and Original hybrid styling, and customize the accent color.
<p align="center">
  <img src="doc-images/settings.png" width="90%" alt="Zunify Settings Screen">
</p>

---

### Key Features

- **Directory Syncing:** Grant access to local music folders using the standard File System Access API. Zunify handles directory traversal and incremental scanning.
- **Local Metadata Extraction:** Parses MP3, M4A, FLAC, and WAV audio metadata (album art, artist names, track info, year, duration) locally using `music-metadata-browser`.
- **Zune's Heart Rating System:** Quickly favorite or un-favorite songs with the classic Zune heart icon to customize your Quickplay hub.
- **Visual Customization:**
  - **Themes:** Choose from **Original** (Zune's iconic hybrid dark/light layout), **Pure Dark**, or **Pure Light**.
  - **Accent Colors:** Six custom accent presets including **Magenta** (Zune's signature pink), **Orange**, **Cyan**, **Green**, **Red**, and **Yellow**.
  - **Dynamic Elements:** The tab favicons and system theme bar colors change dynamically depending on your active accent color and theme selection.
- **Playlists & History:** Create custom playlists locally. The app retains a rolling playback history of your last 50 songs.
- **PWA Support:** Serves static files and controls assets using Service Workers, allowing immediate local loads and offline operations.

---

### Technical Architecture

Zunify is built purely on modern web technologies:
- **Framework:** [Angular 19](https://angular.dev/) with Signals for reactive, efficient state updates.
- **Database:** [Dexie.js](https://dexie.org/) as a robust IndexedDB wrapper to store scanned metadata, local playlist mappings, and cached album art Blobs.
- **Audio Core:** Web Audio API & native Audio Elements for seamless local file playback.
- **Styling:** CSS variables mapped dynamically to theme settings for instant accent/theme transitions.

---

### Developer Setup

To run Zunify locally or host it on your own server, follow these instructions.

#### Prerequisites
- Node.js (v18.19+ recommended)
- Angular CLI (`npm i -g @angular/cli`)

#### Running Locally
1. Clone the repository and navigate to the project directory:
   ```bash
   cd zunify
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the Angular development server:
   ```bash
   npm start
   ```
4. Open your browser and navigate to `http://localhost:4200/`.

#### Building for Production
To compile and build optimized static assets for hosting or deployment:
```bash
npm run build
```
The output directory will be created at `dist/zunify`. You can host these files on any static hosting provider (e.g., GitHub Pages, Vercel, Netlify, Cloudflare Pages).

---

### License

This project is open-source and available under the [MIT License](LICENSE).
