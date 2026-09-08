import { TrackRecord, AlbumArtRecord } from './db.service';

/**
 * 26 Public-Domain / Royalty-Free Demo Tracks
 * Covering Synthwave, Lo-Fi, Classical (Chopin, Debussy), Ambient, and Ragtime (Joplin)
 */
export const DEMO_TRACKS: Omit<TrackRecord, 'id'>[] = [
  // Album 1: Metro Nights - Zune Collective (Synthwave / Electro)
  {
    filePath: 'demo:track-1',
    folderId: 0,
    title: 'Midnight Neon',
    artist: 'Zune Collective',
    album: 'Metro Nights',
    genre: 'Synthwave',
    duration: 222,
    trackNumber: 1,
    year: 2026,
    heart: 1,
    playCount: 48,
    lastPlayed: Date.now() - 1000 * 60 * 15,
    albumArtKey: 'zune collective - metro nights'
  },
  {
    filePath: 'demo:track-2',
    folderId: 0,
    title: 'Retrograde Horizon',
    artist: 'Zune Collective',
    album: 'Metro Nights',
    genre: 'Synthwave',
    duration: 255,
    trackNumber: 2,
    year: 2026,
    heart: 1,
    playCount: 36,
    lastPlayed: Date.now() - 1000 * 60 * 45,
    albumArtKey: 'zune collective - metro nights'
  },
  {
    filePath: 'demo:track-3',
    folderId: 0,
    title: 'Digital Sunset',
    artist: 'Zune Collective',
    album: 'Metro Nights',
    genre: 'Synthwave',
    duration: 198,
    trackNumber: 3,
    year: 2026,
    heart: 0,
    playCount: 22,
    albumArtKey: 'zune collective - metro nights'
  },
  {
    filePath: 'demo:track-4',
    folderId: 0,
    title: 'Electric Velocity',
    artist: 'Zune Collective',
    album: 'Metro Nights',
    genre: 'Synthwave',
    duration: 235,
    trackNumber: 4,
    year: 2026,
    heart: 0,
    playCount: 15,
    albumArtKey: 'zune collective - metro nights'
  },
  {
    filePath: 'demo:track-5',
    folderId: 0,
    title: 'Grid Walker',
    artist: 'Zune Collective',
    album: 'Metro Nights',
    genre: 'Synthwave',
    duration: 242,
    trackNumber: 5,
    year: 2026,
    heart: 1,
    playCount: 29,
    albumArtKey: 'zune collective - metro nights'
  },

  // Album 2: Analog Dreams - Velvet Drive (Chillwave / Lo-Fi)
  {
    filePath: 'demo:track-6',
    folderId: 0,
    title: 'Memory Lane',
    artist: 'Velvet Drive',
    album: 'Analog Dreams',
    genre: 'Lo-Fi',
    duration: 192,
    trackNumber: 1,
    year: 2025,
    heart: 1,
    playCount: 41,
    lastPlayed: Date.now() - 1000 * 60 * 90,
    albumArtKey: 'velvet drive - analog dreams'
  },
  {
    filePath: 'demo:track-7',
    folderId: 0,
    title: 'Subtle Echoes',
    artist: 'Velvet Drive',
    album: 'Analog Dreams',
    genre: 'Lo-Fi',
    duration: 174,
    trackNumber: 2,
    year: 2025,
    heart: 0,
    playCount: 18,
    albumArtKey: 'velvet drive - analog dreams'
  },
  {
    filePath: 'demo:track-8',
    folderId: 0,
    title: 'Analog Solitude',
    artist: 'Velvet Drive',
    album: 'Analog Dreams',
    genre: 'Lo-Fi',
    duration: 210,
    trackNumber: 3,
    year: 2025,
    heart: 1,
    playCount: 33,
    albumArtKey: 'velvet drive - analog dreams'
  },
  {
    filePath: 'demo:track-9',
    folderId: 0,
    title: 'Warm Vinyl',
    artist: 'Velvet Drive',
    album: 'Analog Dreams',
    genre: 'Lo-Fi',
    duration: 225,
    trackNumber: 4,
    year: 2025,
    heart: 0,
    playCount: 12,
    albumArtKey: 'velvet drive - analog dreams'
  },
  {
    filePath: 'demo:track-10',
    folderId: 0,
    title: 'Dusk in Kyoto',
    artist: 'Velvet Drive',
    album: 'Analog Dreams',
    genre: 'Lo-Fi',
    duration: 200,
    trackNumber: 5,
    year: 2025,
    heart: 0,
    playCount: 26,
    albumArtKey: 'velvet drive - analog dreams'
  },

  // Album 3: Nocturnes & Classics - Frédéric Chopin (Public Domain Classical)
  {
    filePath: 'demo:track-11',
    folderId: 0,
    title: 'Nocturne in E-flat, Op. 9 No. 2',
    artist: 'Frédéric Chopin',
    album: 'Nocturnes & Classics',
    genre: 'Classical',
    duration: 258,
    trackNumber: 1,
    year: 1832,
    heart: 1,
    playCount: 52,
    lastPlayed: Date.now() - 1000 * 60 * 120,
    albumArtKey: 'frédéric chopin - nocturnes & classics'
  },
  {
    filePath: 'demo:track-12',
    folderId: 0,
    title: 'Raindrop Prelude, Op. 28 No. 15',
    artist: 'Frédéric Chopin',
    album: 'Nocturnes & Classics',
    genre: 'Classical',
    duration: 312,
    trackNumber: 2,
    year: 1839,
    heart: 0,
    playCount: 19,
    albumArtKey: 'frédéric chopin - nocturnes & classics'
  },
  {
    filePath: 'demo:track-13',
    folderId: 0,
    title: 'Minute Waltz, Op. 64 No. 1',
    artist: 'Frédéric Chopin',
    album: 'Nocturnes & Classics',
    genre: 'Classical',
    duration: 130,
    trackNumber: 3,
    year: 1847,
    heart: 0,
    playCount: 14,
    albumArtKey: 'frédéric chopin - nocturnes & classics'
  },
  {
    filePath: 'demo:track-14',
    folderId: 0,
    title: 'Fantaisie-Impromptu, Op. 66',
    artist: 'Frédéric Chopin',
    album: 'Nocturnes & Classics',
    genre: 'Classical',
    duration: 285,
    trackNumber: 4,
    year: 1834,
    heart: 1,
    playCount: 37,
    albumArtKey: 'frédéric chopin - nocturnes & classics'
  },

  // Album 4: Impressionist Horizons - Claude Debussy (Public Domain Classical)
  {
    filePath: 'demo:track-15',
    folderId: 0,
    title: 'Clair de Lune',
    artist: 'Claude Debussy',
    album: 'Impressionist Horizons',
    genre: 'Classical',
    duration: 315,
    trackNumber: 1,
    year: 1905,
    heart: 1,
    playCount: 60,
    lastPlayed: Date.now() - 1000 * 60 * 180,
    albumArtKey: 'claude debussy - impressionist horizons'
  },
  {
    filePath: 'demo:track-16',
    folderId: 0,
    title: 'Deux Arabesques: No. 1',
    artist: 'Claude Debussy',
    album: 'Impressionist Horizons',
    genre: 'Classical',
    duration: 270,
    trackNumber: 2,
    year: 1891,
    heart: 0,
    playCount: 16,
    albumArtKey: 'claude debussy - impressionist horizons'
  },
  {
    filePath: 'demo:track-17',
    folderId: 0,
    title: 'Rêverie',
    artist: 'Claude Debussy',
    album: 'Impressionist Horizons',
    genre: 'Classical',
    duration: 250,
    trackNumber: 3,
    year: 1890,
    heart: 0,
    playCount: 23,
    albumArtKey: 'claude debussy - impressionist horizons'
  },
  {
    filePath: 'demo:track-18',
    folderId: 0,
    title: 'La Fille aux Cheveux de Lin',
    artist: 'Claude Debussy',
    album: 'Impressionist Horizons',
    genre: 'Classical',
    duration: 175,
    trackNumber: 4,
    year: 1910,
    heart: 0,
    playCount: 11,
    albumArtKey: 'claude debussy - impressionist horizons'
  },

  // Album 5: Cybernetic Pulse - Subtle Flux (Ambient / IDM)
  {
    filePath: 'demo:track-19',
    folderId: 0,
    title: 'Quantum Flux',
    artist: 'Subtle Flux',
    album: 'Cybernetic Pulse',
    genre: 'Ambient',
    duration: 215,
    trackNumber: 1,
    year: 2026,
    heart: 0,
    playCount: 19,
    albumArtKey: 'subtle flux - cybernetic pulse'
  },
  {
    filePath: 'demo:track-20',
    folderId: 0,
    title: 'Deep Field Resonance',
    artist: 'Subtle Flux',
    album: 'Cybernetic Pulse',
    genre: 'Ambient',
    duration: 262,
    trackNumber: 2,
    year: 2026,
    heart: 1,
    playCount: 31,
    albumArtKey: 'subtle flux - cybernetic pulse'
  },
  {
    filePath: 'demo:track-21',
    folderId: 0,
    title: 'Atmospheric Entry',
    artist: 'Subtle Flux',
    album: 'Cybernetic Pulse',
    genre: 'Ambient',
    duration: 228,
    trackNumber: 3,
    year: 2026,
    heart: 0,
    playCount: 8,
    albumArtKey: 'subtle flux - cybernetic pulse'
  },
  {
    filePath: 'demo:track-22',
    folderId: 0,
    title: 'Orbital Echo',
    artist: 'Subtle Flux',
    album: 'Cybernetic Pulse',
    genre: 'Ambient',
    duration: 245,
    trackNumber: 4,
    year: 2026,
    heart: 0,
    playCount: 14,
    albumArtKey: 'subtle flux - cybernetic pulse'
  },

  // Album 6: Golden Era Ragtime - Scott Joplin (Public Domain Jazz & Ragtime)
  {
    filePath: 'demo:track-23',
    folderId: 0,
    title: 'The Entertainer',
    artist: 'Scott Joplin',
    album: 'Golden Era Ragtime',
    genre: 'Ragtime',
    duration: 205,
    trackNumber: 1,
    year: 1902,
    heart: 1,
    playCount: 45,
    lastPlayed: Date.now() - 1000 * 60 * 240,
    albumArtKey: 'scott joplin - golden era ragtime'
  },
  {
    filePath: 'demo:track-24',
    folderId: 0,
    title: 'Maple Leaf Rag',
    artist: 'Scott Joplin',
    album: 'Golden Era Ragtime',
    genre: 'Ragtime',
    duration: 195,
    trackNumber: 2,
    year: 1899,
    heart: 0,
    playCount: 27,
    albumArtKey: 'scott joplin - golden era ragtime'
  },
  {
    filePath: 'demo:track-25',
    folderId: 0,
    title: 'Bethena (A Concert Waltz)',
    artist: 'Scott Joplin',
    album: 'Golden Era Ragtime',
    genre: 'Ragtime',
    duration: 260,
    trackNumber: 3,
    year: 1905,
    heart: 0,
    playCount: 17,
    albumArtKey: 'scott joplin - golden era ragtime'
  },
  {
    filePath: 'demo:track-26',
    folderId: 0,
    title: 'Solace (A Mexican Serenade)',
    artist: 'Scott Joplin',
    album: 'Golden Era Ragtime',
    genre: 'Ragtime',
    duration: 230,
    trackNumber: 4,
    year: 1909,
    heart: 1,
    playCount: 38,
    albumArtKey: 'scott joplin - golden era ragtime'
  }
];

/**
 * Generates custom, rich SVG Album Art Blobs matching Zune Metro aesthetics
 */
export function generateAlbumArtRecords(): AlbumArtRecord[] {
  const albums = [
    {
      key: 'zune collective - metro nights',
      title: 'Metro Nights',
      artist: 'Zune Collective',
      color1: '#E5007D',
      color2: '#160824',
      accentColor: '#FF1A8C',
      pattern: 'bars'
    },
    {
      key: 'velvet drive - analog dreams',
      title: 'Analog Dreams',
      artist: 'Velvet Drive',
      color1: '#00BCF9',
      color2: '#0B1528',
      accentColor: '#38BDF8',
      pattern: 'disc'
    },
    {
      key: 'frédéric chopin - nocturnes & classics',
      title: 'Nocturnes',
      artist: 'Frédéric Chopin',
      color1: '#B45309',
      color2: '#1C1917',
      accentColor: '#F59E0B',
      pattern: 'waves'
    },
    {
      key: 'claude debussy - impressionist horizons',
      title: 'Horizons',
      artist: 'Claude Debussy',
      color1: '#059669',
      color2: '#062820',
      accentColor: '#34D399',
      pattern: 'rings'
    },
    {
      key: 'subtle flux - cybernetic pulse',
      title: 'Cyber Pulse',
      artist: 'Subtle Flux',
      color1: '#7C3AED',
      color2: '#130B24',
      accentColor: '#A78BFA',
      pattern: 'grid'
    },
    {
      key: 'scott joplin - golden era ragtime',
      title: 'Ragtime Classics',
      artist: 'Scott Joplin',
      color1: '#D97706',
      color2: '#241407',
      accentColor: '#FBBF24',
      pattern: 'piano'
    }
  ];

  return albums.map(a => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
        <defs>
          <linearGradient id="g_${a.color1.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${a.color1}" />
            <stop offset="100%" stop-color="${a.color2}" />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000" flood-opacity="0.6"/>
          </filter>
        </defs>
        <rect width="500" height="500" fill="url(#g_${a.color1.replace('#', '')})" />
        
        <!-- Abstract Zune Geometric Graphics -->
        <circle cx="250" cy="220" r="160" fill="none" stroke="${a.accentColor}" stroke-width="2" opacity="0.35"/>
        <circle cx="250" cy="220" r="110" fill="none" stroke="${a.accentColor}" stroke-width="1.5" opacity="0.5"/>
        <circle cx="250" cy="220" r="60" fill="${a.accentColor}" opacity="0.15"/>
        
        <!-- Metro Typography Header -->
        <g transform="translate(45, 380)" filter="url(#shadow)">
          <text x="0" y="30" font-family="'Outfit', 'Segoe UI', sans-serif" font-weight="200" font-size="22" fill="#E4E4E7" letter-spacing="1.5" text-transform="uppercase">${a.artist}</text>
          <text x="0" y="75" font-family="'Outfit', 'Segoe UI', sans-serif" font-weight="700" font-size="42" fill="#FFFFFF" letter-spacing="-1">${a.title}</text>
        </g>
        
        <!-- Subtle Corner Zune Tag -->
        <rect x="420" y="40" width="40" height="40" rx="20" fill="rgba(255,255,255,0.08)"/>
        <text x="440" y="66" font-family="'Outfit', sans-serif" font-size="18" font-weight="300" fill="${a.accentColor}" text-anchor="middle">Z</text>
      </svg>
    `;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    return {
      albumKey: a.key,
      blob,
      mimeType: 'image/svg+xml'
    };
  });
}

/**
 * Real Free / Royalty-Free MP3 Audio Tracks mapped to Demo Tracks
 */
export const DEMO_AUDIO_FILES: Record<string, string> = {
  'demo:track-1': 'assets/audio/electronic_pulse.mp3',
  'demo:track-2': 'assets/audio/witness_ost.mp3',
  'demo:track-3': 'assets/audio/dreamcore.mp3',
  'demo:track-4': 'assets/audio/electronic_pulse.mp3',
  'demo:track-5': 'assets/audio/witness_ost.mp3',
  'demo:track-6': 'assets/audio/returning_home.mp3',
  'demo:track-7': 'assets/audio/charlotte_ost.mp3',
  'demo:track-8': 'assets/audio/joyful_donuts.mp3',
  'demo:track-9': 'assets/audio/walk_3am.mp3',
  'demo:track-10': 'assets/audio/nostalgia.mp3',
  'demo:track-11': 'assets/audio/charlotte_ost.mp3',
  'demo:track-12': 'assets/audio/nostalgia.mp3',
  'demo:track-13': 'assets/audio/returning_home.mp3',
  'demo:track-14': 'assets/audio/dreamlight.mp3',
  'demo:track-15': 'assets/audio/dreamcore.mp3',
  'demo:track-16': 'assets/audio/dreamlight.mp3',
  'demo:track-17': 'assets/audio/charlotte_ost.mp3',
  'demo:track-18': 'assets/audio/returning_home.mp3',
  'demo:track-19': 'assets/audio/electronic_pulse.mp3',
  'demo:track-20': 'assets/audio/witness_ost.mp3',
  'demo:track-21': 'assets/audio/dreamcore.mp3',
  'demo:track-22': 'assets/audio/electronic_pulse.mp3',
  'demo:track-23': 'assets/audio/joyful_donuts.mp3',
  'demo:track-24': 'assets/audio/walk_3am.mp3',
  'demo:track-25': 'assets/audio/joyful_donuts.mp3',
  'demo:track-26': 'assets/audio/returning_home.mp3'
};

const audioBlobCache = new Map<string, Blob>();

/**
 * Loads the real royalty-free / public domain MP3 audio file
 */
export async function getDemoTrackAudioBlob(track: TrackRecord): Promise<Blob> {
  if (audioBlobCache.has(track.filePath)) {
    return audioBlobCache.get(track.filePath)!;
  }

  const audioPath = DEMO_AUDIO_FILES[track.filePath] || 'assets/audio/returning_home.mp3';
  try {
    const res = await fetch(audioPath);
    if (res.ok) {
      const blob = await res.blob();
      audioBlobCache.set(track.filePath, blob);
      return blob;
    }
  } catch (err) {
    console.warn('Could not fetch real audio file, falling back:', err);
  }

  return new Blob([], { type: 'audio/mp3' });
}
