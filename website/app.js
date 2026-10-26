/**
 * Zunify website: the site is the player.
 *
 * - Hero: a living Zune "Now Playing" (album mosaic, drifting type, spinning disc)
 * - Web Audio: one analyser drives the spectrum, mosaic, type, tiles, mini player, wordmark
 * - Scroll-scrubbed manifesto + Zune HD style horizontal panorama
 * - WP7-style live tiles, accent switcher, OS-aware downloads from the latest GitHub release
 */

const REPO = 'breejesh/zunify';
const LATEST_DOWNLOAD = `https://github.com/${REPO}/releases/latest/download/`;

// Royalty-free tracks from the demo library (same files the in-browser demo plays)
const TRACKS = [
  { title: 'Midnight Neon', artist: 'Zune Collective', album: 'Metro Nights', src: 'demo/assets/audio/electronic_pulse.mp3', cover: 'assets/covers/metro_nights.jpg' },
  { title: 'Memory Lane', artist: 'Velvet Drive', album: 'Analog Dreams', src: 'demo/assets/audio/returning_home.mp3', cover: 'assets/covers/analog_dreams.jpg' },
  { title: 'Deep Field', artist: 'Subtle Flux', album: 'Cybernetic Pulse', src: 'demo/assets/audio/dreamcore.mp3', cover: 'assets/covers/cyber_pulse.jpg' },
  { title: 'Dusk in Kyoto', artist: 'Velvet Drive', album: 'Analog Dreams', src: 'demo/assets/audio/nostalgia.mp3', cover: 'assets/covers/analog_dreams.jpg' },
  { title: 'Walk at 3 AM', artist: 'Zune Collective', album: 'Metro Nights', src: 'demo/assets/audio/walk_3am.mp3', cover: 'assets/covers/metro_nights.jpg' }
];

const COVERS = [
  'assets/covers/metro_nights.jpg',
  'assets/covers/analog_dreams.jpg',
  'assets/covers/cyber_pulse.jpg',
  'assets/covers/chopin_nocturnes.jpg',
  'assets/covers/debussy_horizons.jpg',
  'assets/covers/ragtime_classics.jpg'
];

const OS_INFO = {
  windows: {
    label: 'download for windows', meta: 'windows 10 & 11 · 64-bit', asset: 'Zunify-Setup-x64.exe',
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.45 9.75 2.1v9.45H0m10.95-9.6L24 0v11.4H10.95M0 12.6h9.75v9.45L0 20.7m10.95-8.1H24V24l-13.05-1.8"/></svg>'
  },
  mac: {
    label: 'download for macos', meta: 'apple silicon · intel below', asset: 'Zunify-mac-arm64.dmg',
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.1.64-2.76 1.41-.57.65-1.07 1.7-1 2.76 1.07.08 2.14-.55 2.75-1.3z"/></svg>'
  },
  linux: {
    label: 'download for linux', meta: 'universal appimage · x64', asset: 'Zunify-linux-x86_64.AppImage',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c-2.2 0-3.5 1.9-3.5 4.4 0 1.5.4 2.5.4 3.6 0 1.4-2.9 4.2-2.9 7.3 0 .9.3 1.6.8 2.1M12 2c2.2 0 3.5 1.9 3.5 4.4 0 1.5-.4 2.5-.4 3.6 0 1.4 2.9 4.2 2.9 7.3 0 .9-.3 1.6-.8 2.1"/></svg>'
  }
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

document.documentElement.classList.remove('no-js');

/* ==========================================================================
   AUDIO ENGINE
   ========================================================================== */
const player = {
  audio: new Audio(),
  ctx: null,
  analyser: null,
  freq: null,
  index: 0,
  playing: false,
  started: false,
  // smoothed analysis values (0..1)
  bass: 0,
  mid: 0,
  high: 0,
  energy: 0,
  bassAvg: 0,
  lastBeat: 0,
  bands: new Float32Array(32),
  listeners: { beat: [], track: [], state: [] },

  on(evt, fn) { this.listeners[evt].push(fn); },
  emit(evt, arg) { this.listeners[evt].forEach(fn => fn(arg)); },

  get track() { return TRACKS[this.index]; },

  setupGraph() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    const source = this.ctx.createMediaElementSource(this.audio);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.78;
    this.freq = new Uint8Array(this.analyser.frequencyBinCount);
    source.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  },

  load(i) {
    this.index = (i + TRACKS.length) % TRACKS.length;
    this.audio.src = this.track.src;
    this.emit('track', this.track);
  },

  async play() {
    if (!this.started) {
      this.started = true;
      this.audio.preload = 'auto';
      this.load(this.index);
    }
    this.setupGraph();
    if (this.ctx && this.ctx.state === 'suspended') await this.ctx.resume();
    try {
      await this.audio.play();
    } catch (e) {
      console.warn('Playback blocked:', e);
    }
  },

  pause() { this.audio.pause(); },
  toggle() { this.playing ? this.pause() : this.play(); },
  next() { this.load(this.index + 1); this.play(); },
  prev() {
    if (this.audio.currentTime > 3) { this.audio.currentTime = 0; return; }
    this.load(this.index - 1);
    this.play();
  },

  // Called once per animation frame
  analyse(now) {
    if (!this.analyser || !this.playing) {
      // Decay to silence so visuals settle smoothly when paused
      this.bass *= 0.9; this.mid *= 0.9; this.high *= 0.9; this.energy *= 0.9;
      for (let i = 0; i < this.bands.length; i++) this.bands[i] *= 0.88;
      return;
    }
    this.analyser.getByteFrequencyData(this.freq);
    const f = this.freq;
    const avg = (a, b) => { let s = 0; for (let i = a; i < b; i++) s += f[i]; return s / ((b - a) * 255); };

    // ~43 Hz per bin at 44.1 kHz with fftSize 1024
    const bass = avg(1, 7);
    const mid = avg(7, 60);
    const high = avg(60, 220);
    this.bass = lerp(this.bass, bass, 0.5);
    this.mid = lerp(this.mid, mid, 0.35);
    this.high = lerp(this.high, high, 0.35);
    this.energy = lerp(this.energy, bass * 0.5 + mid * 0.35 + high * 0.15, 0.3);

    // Log-spaced bands for bar visualizers
    const n = this.bands.length;
    for (let i = 0; i < n; i++) {
      const a = Math.floor(Math.pow(i / n, 1.9) * 300) + 1;
      const b = Math.max(a + 1, Math.floor(Math.pow((i + 1) / n, 1.9) * 300) + 1);
      this.bands[i] = lerp(this.bands[i], avg(a, b), 0.45);
    }

    // Simple beat detection: bass spikes above its running average
    this.bassAvg = lerp(this.bassAvg, bass, 0.04);
    if (bass > this.bassAvg * 1.28 && bass > 0.42 && now - this.lastBeat > 280) {
      this.lastBeat = now;
      this.emit('beat', bass);
    }
  }
};

player.audio.preload = 'none';
player.audio.addEventListener('play', () => { player.playing = true; player.emit('state', true); });
player.audio.addEventListener('pause', () => { player.playing = false; player.emit('state', false); });
player.audio.addEventListener('ended', () => player.next());

/* ==========================================================================
   BOOT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const os = detectOS();
  initDownloads(os);
  loadLatestRelease();
  initAccent();
  initNav();
  initMosaic();
  initTypeArt();
  initDisc();
  initMiniPlayer();
  initMediaSession();
  initKeyboard();
  initManifesto();
  initPanorama();
  initTiles();
  initWordmark();
  initReveal();
  initDemoFocus();
  startLoop();
});

/* ==========================================================================
   FRAME LOOP: one rAF drives every audio-reactive element
   ========================================================================== */
const frameHooks = [];
const visible = { hero: true, tiles: false, footer: false, demo: false };

function startLoop() {
  const hero = $('#hero');
  const tiles = $('.tiles');
  const mini = $('#miniplayer');

  watchVisibility(hero, v => { visible.hero = v; });
  watchVisibility(tiles, v => { visible.tiles = v; });
  watchVisibility($('.footer'), v => { visible.footer = v; });
  watchVisibility($('#demo-device'), v => { visible.demo = v; });

  let last = performance.now();
  const frame = now => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    player.analyse(now);

    if (visible.hero) {
      hero.style.setProperty('--bass', player.bass.toFixed(3));
      hero.style.setProperty('--energy', player.energy.toFixed(3));
    }
    const beat = player.bass.toFixed(3);
    tiles.style.setProperty('--beat', beat);
    mini.style.setProperty('--beat', beat);

    for (const hook of frameHooks) hook(now, dt);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function watchVisibility(el, cb) {
  if (!el || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: '100px' }).observe(el);
}

/* ==========================================================================
   HERO: mosaic
   ========================================================================== */
function initMosaic() {
  const mosaic = $('#mosaic');
  const pattern = ['span2', '', '', 'tall', '', 'wide', '', '', 'span2', '', '', '', 'wide', 'tall', '', '', 'span2', '', '', 'wide', '', '', 'tall', ''];
  const count = 64;
  const pick = () => COVERS[Math.floor(Math.random() * COVERS.length)];
  const frag = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const tile = document.createElement('div');
    tile.className = `m-tile ${pattern[i % pattern.length]}`;
    tile.innerHTML = `<div class="m-inner"><img src="${pick()}" alt="" decoding="async"><img src="${pick()}" alt="" decoding="async"></div>`;
    frag.appendChild(tile);
  }
  mosaic.appendChild(frag);
  const tiles = $$('.m-tile', mosaic);

  const flipRandom = () => {
    if (!visible.hero) return;
    const tile = tiles[Math.floor(Math.random() * tiles.length)];
    const hidden = tile.querySelectorAll('img')[tile.classList.contains('flipped') ? 0 : 1];
    hidden.src = pick();
    tile.classList.toggle('flipped');
  };

  if (!reducedMotion) {
    // Idle: the slow shuffle of the Zune Now Playing screen
    setInterval(() => { if (!player.playing) flipRandom(); }, 1400);
    // Playing: tiles flip and flash on the beat
    player.on('beat', () => {
      flipRandom();
      const t = tiles[Math.floor(Math.random() * tiles.length)];
      t.classList.add('hit');
      setTimeout(() => t.classList.remove('hit'), 140);
    });
  }
}

/* ==========================================================================
   HERO: drifting type rows (speed follows the music)
   ========================================================================== */
function initTypeArt() {
  const rows = [
    { el: $('.type-row.r1 .type-track'), speed: -26 },
    { el: $('.type-row.r2 .type-track'), speed: 44 },
    { el: $('.type-row.r3 .type-track'), speed: -34 },
    { el: $('.type-row.r4 .type-track'), speed: 58 }
  ].filter(r => r.el);

  rows.forEach(r => { r.x = 0; r.half = r.el.scrollWidth / 2; });
  const measure = () => rows.forEach(r => { r.half = r.el.scrollWidth / 2; });
  window.addEventListener('resize', measure);
  document.fonts?.ready.then(measure);

  player.on('track', t => {
    $$('.js-art-artist').forEach(e => { e.textContent = t.artist.toLowerCase(); });
    $$('.js-art-title').forEach(e => { e.textContent = t.title.toLowerCase(); });
    $$('.js-art-album').forEach(e => { e.textContent = t.album.toLowerCase(); });
    requestAnimationFrame(measure);
  });

  if (reducedMotion) return;
  frameHooks.push((now, dt) => {
    if (!visible.hero) return;
    const boost = 1 + player.energy * 5;
    for (const r of rows) {
      r.x += r.speed * boost * dt;
      if (r.half > 0) {
        if (r.x <= -r.half) r.x += r.half;
        if (r.x > 0) r.x -= r.half;
      }
      r.el.style.transform = `translate3d(${r.x.toFixed(1)}px,0,0)`;
    }
  });
}

/* ==========================================================================
   HERO: the disc + radial spectrum
   ========================================================================== */
function initDisc() {
  const disc = $('#disc');
  const art = $('#disc-art');
  const hint = $('.js-disc-hint');
  const canvas = $('#spectrum');
  const ctx = canvas.getContext('2d');

  disc.addEventListener('click', () => player.toggle());

  player.on('state', playing => {
    document.body.classList.toggle('playing', playing);
    disc.setAttribute('aria-label', playing ? 'Pause the Zunify soundtrack' : 'Play the Zunify soundtrack');
    hint.textContent = playing ? 'now playing' : (player.started ? 'paused' : 'press play');
  });

  player.on('track', t => {
    art.style.opacity = '0';
    setTimeout(() => { art.src = t.cover; art.style.opacity = '1'; }, 250);
    $$('.js-np-title').forEach(e => { e.textContent = t.title.toLowerCase(); });
    $$('.js-np-artist').forEach(e => { e.textContent = t.artist.toLowerCase(); });
  });

  // Spectrum colours follow the accent
  let colA = '#ec008c', colB = '#ff6a00';
  const readColours = () => {
    const cs = getComputedStyle(document.body);
    colA = cs.getPropertyValue('--accent').trim() || colA;
    colB = cs.getPropertyValue('--accent-2').trim() || colB;
  };
  readColours();
  document.addEventListener('accentchange', readColours);

  let w = 0, h = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  };
  resize();
  window.addEventListener('resize', resize);

  const BARS = 120;
  const values = new Float32Array(BARS);

  frameHooks.push(now => {
    if (!visible.hero || !w) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const discR = w / 1.68 / 2;
    const r0 = discR * 1.07;
    const maxLen = discR * 0.36;
    const t = now / 1000;
    const half = BARS / 2;

    for (let i = 0; i < BARS; i++) {
      // Mirror the spectrum so it's symmetric left/right, bass at the top
      const k = i < half ? i : BARS - 1 - i;
      const bandPos = (k / half) * (player.bands.length - 1);
      const lo = Math.floor(bandPos);
      const band = lerp(player.bands[lo], player.bands[Math.min(lo + 1, player.bands.length - 1)], bandPos - lo);
      const idle = reducedMotion ? 0.05 : 0.05 + 0.04 * Math.sin(t * 1.6 + k * 0.35) + 0.03 * Math.sin(t * 0.7 - k * 0.2);
      // Noise floor + curve keeps the frequency shape visible on loud masters
      const shaped = Math.pow(clamp((band - 0.28) / 0.62, 0, 1), 1.5);
      const target = Math.max(idle, shaped);
      values[i] = lerp(values[i], target, 0.35);
    }

    let grad;
    if (ctx.createConicGradient) {
      grad = ctx.createConicGradient(-Math.PI / 2, cx, cy);
      grad.addColorStop(0, colA);
      grad.addColorStop(0.5, colB);
      grad.addColorStop(1, colA);
    } else {
      grad = colA;
    }

    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1.5, (2 * Math.PI * r0) / BARS * 0.42);
    ctx.strokeStyle = grad;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    for (let i = 0; i < BARS; i++) {
      const a = (i / BARS) * Math.PI * 2 - Math.PI / 2;
      const len = 3 + values[i] * maxLen;
      const cos = Math.cos(a), sin = Math.sin(a);
      ctx.moveTo(cx + cos * r0, cy + sin * r0);
      ctx.lineTo(cx + cos * (r0 + len), cy + sin * (r0 + len));
    }
    ctx.stroke();

    // Soft echo ring that breathes with the bass
    ctx.globalAlpha = 0.18 + player.bass * 0.4;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r0 + maxLen * (0.55 + player.bass * 0.5), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
}

/* ==========================================================================
   MINI PLAYER
   ========================================================================== */
function initMiniPlayer() {
  const mini = $('#miniplayer');
  const bar = $('#mp-bar');
  const eq = $$('.mp-eq i', mini);
  const art = $('.js-mp-art');

  $('#mp-play').addEventListener('click', () => player.toggle());
  $('#mp-next').addEventListener('click', () => player.next());
  $('#mp-prev').addEventListener('click', () => player.prev());

  // In the hero the disc is the player; the mini player takes over once you scroll past it,
  // and steps aside while the live demo (which has its own player bar) is on screen
  const sync = () => mini.classList.toggle('show', player.started && !visible.hero && !visible.demo);
  player.on('state', sync);
  frameHooks.push(sync);
  player.on('track', t => { art.src = t.cover; });

  $('#mp-progress').addEventListener('click', e => {
    const r = e.currentTarget.getBoundingClientRect();
    if (player.audio.duration) player.audio.currentTime = ((e.clientX - r.left) / r.width) * player.audio.duration;
  });

  frameHooks.push(() => {
    if (!player.started) return;
    const a = player.audio;
    bar.style.transform = `scaleX(${a.duration ? (a.currentTime / a.duration).toFixed(4) : 0})`;
    eq.forEach((e, i) => {
      const v = player.bands[3 + i * 6] || 0;
      e.style.transform = `scaleY(${Math.max(0.15, Math.min(1, v * 1.5)).toFixed(3)})`;
    });
  });
}

function initMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const ms = navigator.mediaSession;
  ms.setActionHandler('play', () => player.play());
  ms.setActionHandler('pause', () => player.pause());
  ms.setActionHandler('nexttrack', () => player.next());
  ms.setActionHandler('previoustrack', () => player.prev());
  player.on('track', t => {
    const abs = new URL(t.cover, location.href).href;
    ms.metadata = new MediaMetadata({
      title: t.title, artist: t.artist, album: `${t.album} · zunify.app`,
      artwork: [{ src: abs, sizes: '560x560', type: 'image/jpeg' }]
    });
  });
  player.on('state', p => { ms.playbackState = p ? 'playing' : 'paused'; });
}

function initKeyboard() {
  const keys = $$('.keys kbd');
  const press = i => {
    const k = keys[i];
    if (!k) return;
    k.classList.add('pressed');
    setTimeout(() => k.classList.remove('pressed'), 160);
  };
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select', 'button', 'a', 'iframe'].includes(tag) || e.target.isContentEditable) return;
    if (e.code === 'Space') { e.preventDefault(); player.toggle(); press(1); }
    else if (e.code === 'ArrowRight' && player.started) { player.next(); press(2); }
    else if (e.code === 'ArrowLeft' && player.started) { player.prev(); press(0); }
  });
}

/* Clicking into the live demo pauses the site soundtrack so they don't play over each other */
function initDemoFocus() {
  window.addEventListener('blur', () => {
    setTimeout(() => {
      if (document.activeElement && document.activeElement.tagName === 'IFRAME' && player.playing) player.pause();
    }, 0);
  });
}

/* ==========================================================================
   MANIFESTO: words light up as you scroll
   ========================================================================== */
function initManifesto() {
  const section = $('#manifesto');
  const text = $('#manifesto-text');
  if (!section || !text) return;

  const raw = text.textContent.trim().replace(/\s+/g, ' ');
  text.textContent = '';
  const words = raw.split(' ').map(word => {
    const em = word.startsWith('*');
    const clean = word.replace(/\*/g, '');
    const span = document.createElement('span');
    span.className = em ? 'w em' : 'w';
    span.textContent = clean;
    text.append(span, ' ');
    return span;
  });
  text.setAttribute('aria-label', raw.replace(/\*/g, ''));

  onScroll(() => {
    const r = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    const p = clamp(-r.top / (total * 0.85), 0, 1);
    const lit = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('lit', i < lit));
  });
}

/* ==========================================================================
   PANORAMA: vertical scroll drives a horizontal Zune HD hub
   ========================================================================== */
function initPanorama() {
  const section = $('#panorama');
  const track = $('#pano-track');
  const title = $('#pano-title');
  const bar = $('#pano-bar');
  const shots = $$('.shot', track);
  const mq = window.matchMedia('(max-width: 860px)');
  let distance = 0;

  const layout = () => {
    if (mq.matches) { section.style.height = ''; return; }
    distance = Math.max(0, track.scrollWidth - window.innerWidth);
    section.style.height = `${distance + window.innerHeight}px`;
  };
  layout();
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);

  onScroll(() => {
    if (mq.matches) return;
    const r = section.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    const p = clamp(-r.top / Math.max(1, distance), 0, 1);
    track.style.transform = `translate3d(${(-p * distance).toFixed(1)}px,0,0)`;
    // Title slides slower than the content: the Zune HD parallax
    const titleTravel = Math.max(0, title.scrollWidth - window.innerWidth * 0.6);
    title.style.transform = `translate3d(${(-p * titleTravel).toFixed(1)}px,0,0)`;
    bar.style.transform = `scaleX(${p.toFixed(4)})`;

    const mid = window.innerWidth / 2;
    shots.forEach(s => {
      const sr = s.getBoundingClientRect();
      const d = clamp((sr.left + sr.width / 2 - mid) / window.innerWidth, -1, 1);
      s.style.setProperty('--ry', `${(-d * 16).toFixed(2)}deg`);
      s.style.setProperty('--s', (1 - Math.abs(d) * 0.08).toFixed(3));
    });
  });
}

/* ==========================================================================
   LIVE TILES
   ========================================================================== */
function initTiles() {
  const tilesEl = $('.tiles');

  // Live peek: cover art ↔ description
  const peek = $('.live-peek');
  // Flip: 0 accounts ↔ 0 trackers
  const flip = $('.t-private');
  // Format ticker
  const ticker = $('.ticker-inner');
  const items = ticker ? ticker.children.length : 0;
  let tick = 0;

  if (!reducedMotion) {
    setInterval(() => { if (visible.tiles) peek?.classList.toggle('peeked'); }, 4200);
    setInterval(() => { if (visible.tiles) flip?.classList.toggle('flipped'); }, 3100);
    setInterval(() => {
      if (!visible.tiles || !ticker) return;
      tick++;
      const lineH = ticker.children[0].getBoundingClientRect().height;
      ticker.style.transition = '';
      ticker.style.transform = `translateY(${-tick * lineH}px)`;
      if (tick === items - 1) {
        // Last item duplicates the first: snap back invisibly
        setTimeout(() => {
          ticker.style.transition = 'none';
          ticker.style.transform = 'translateY(0)';
          tick = 0;
        }, 750);
      }
    }, 1700);
  }

  player.on('track', t => { $$('.js-tile-cover').forEach(img => { img.src = t.cover; }); });
  player.on('state', p => tilesEl.classList.toggle('playing', p));

  // EQ tile
  const eq = $('#tile-eq');
  const bars = [];
  for (let i = 0; i < 18; i++) {
    const b = document.createElement('i');
    eq.appendChild(b);
    bars.push(b);
  }
  frameHooks.push(now => {
    if (!visible.tiles) return;
    const t = now / 1000;
    bars.forEach((b, i) => {
      const band = player.bands[Math.min(player.bands.length - 1, Math.floor(i * 1.6))];
      const idle = reducedMotion ? 0.1 : 0.12 + 0.08 * Math.sin(t * 2.2 + i * 0.6);
      const v = player.playing ? Math.max(0.05, band * 1.25) : idle;
      b.style.transform = `scaleY(${Math.min(1, v).toFixed(3)})`;
    });
  });

  // Metro "tilt" press effect: tiles lean toward the pointer
  if (!reducedMotion && window.matchMedia('(hover: hover)').matches) {
    $$('.tile').forEach(tile => {
      tile.addEventListener('pointermove', e => {
        const r = tile.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        tile.style.setProperty('--tx', `${(-y * 7).toFixed(2)}deg`);
        tile.style.setProperty('--ty', `${(x * 7).toFixed(2)}deg`);
      });
      tile.addEventListener('pointerleave', () => {
        tile.style.setProperty('--tx', '0deg');
        tile.style.setProperty('--ty', '0deg');
      });
    });
  }
}

/* ==========================================================================
   FOOTER WORDMARK: each letter is an equalizer band
   ========================================================================== */
function initWordmark() {
  const letters = $$('#wordmark span');
  const bandFor = [1, 4, 8, 12, 17, 23];
  frameHooks.push(() => {
    if (!visible.footer) return;
    letters.forEach((l, i) => {
      const v = player.bands[bandFor[i]] || 0;
      l.style.transform = `scaleY(${(1 + v * 0.32).toFixed(3)})`;
    });
  });
}

/* ==========================================================================
   DOWNLOADS
   ========================================================================== */
function detectOS() {
  const ua = navigator.userAgent || '';
  const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return null;
  if (/Mac/i.test(platform) || /Mac OS X|Macintosh/i.test(ua)) return 'mac';
  if (/Win/i.test(platform) || /Windows/i.test(ua)) return 'windows';
  if (/Linux|X11|CrOS/i.test(platform + ua)) return 'linux';
  return null;
}

function initDownloads(os) {
  $$('[data-asset]').forEach(link => { link.href = LATEST_DOWNLOAD + link.dataset.asset; });
  if (!os) return;
  const info = OS_INFO[os];
  $$('.js-primary-download').forEach(b => { b.href = LATEST_DOWNLOAD + info.asset; });
  $$('.js-os-icon').forEach(el => { el.innerHTML = info.icon; });
  $$('.js-primary-label').forEach(el => { el.textContent = info.label; });
  $$('.js-primary-meta').forEach(el => { el.textContent = info.meta; });
  $(`.dl[data-os="${os}"]`)?.classList.add('recommended');
}

async function loadLatestRelease() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) return;
    const release = await res.json();
    const version = release.tag_name || '';
    $$('.js-version-badge, .js-version-text').forEach(el => { el.textContent = version; });

    const assets = new Map((release.assets || []).map(a => [a.name, a]));
    $$('[data-asset]').forEach(link => {
      const asset = assets.get(link.dataset.asset);
      if (!asset) return;
      link.href = asset.browser_download_url;
      const mb = Math.round(asset.size / 1048576);
      const small = link.querySelector('small');
      if (mb && small && !small.dataset.sized) {
        small.dataset.sized = '1';
        small.textContent += ` · ${mb} MB`;
      }
    });
  } catch {
    // Offline or rate limited: the static releases/latest/download links still work
  }
}

/* ==========================================================================
   ACCENT, NAV, REVEAL, SCROLL
   ========================================================================== */
function initAccent() {
  const swatches = $$('.swatch');
  const set = (accent, persist) => {
    document.body.dataset.accent = accent;
    swatches.forEach(s => {
      const on = s.dataset.accent === accent;
      s.classList.toggle('active', on);
      s.setAttribute('aria-checked', String(on));
    });
    if (persist) { try { localStorage.setItem('zunify-site-accent', accent); } catch {} }
    document.dispatchEvent(new Event('accentchange'));
  };
  let saved = null;
  try { saved = localStorage.getItem('zunify-site-accent'); } catch {}
  set(saved || document.body.dataset.accent, false);
  swatches.forEach(s => s.addEventListener('click', () => set(s.dataset.accent, true)));
}

function initNav() {
  const nav = $('#nav');
  const links = $$('.nav-pivot a');
  const sections = links.map(a => $(a.getAttribute('href')));
  onScroll(() => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
    const y = window.innerHeight * 0.4;
    let active = -1;
    sections.forEach((s, i) => {
      const r = s && s.getBoundingClientRect();
      if (r && r.top < y && r.bottom > y) active = i;
    });
    links.forEach((l, i) => l.classList.toggle('active', i === active));
  });
}

function initReveal() {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  els.forEach(e => io.observe(e));
}

// Batched scroll handlers (one rAF per scroll burst)
const scrollHooks = [];
let scrollQueued = false;
function onScroll(fn) {
  scrollHooks.push(fn);
  fn();
  if (scrollHooks.length === 1) {
    const run = () => { scrollQueued = false; scrollHooks.forEach(h => h()); };
    window.addEventListener('scroll', () => {
      if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(run); }
    }, { passive: true });
    window.addEventListener('resize', run);
  }
}
