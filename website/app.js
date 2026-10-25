/**
 * Zunify website
 * - OS detection for the primary download button
 * - Latest GitHub release lookup (version + direct asset links)
 * - Accent switcher, pivot tour, scroll reveals, hero tilt
 */

const REPO = 'breejesh/zunify';
const LATEST_DOWNLOAD = `https://github.com/${REPO}/releases/latest/download/`;

const OS_INFO = {
  windows: {
    label: 'download for windows',
    meta: 'windows 10 & 11 · 64-bit installer',
    asset: 'Zunify-Setup-x64.exe',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M0 3.45 9.75 2.1v9.45H0m10.95-9.6L24 0v11.4H10.95M0 12.6h9.75v9.45L0 20.7m10.95-8.1H24V24l-13.05-1.8"/></svg>'
  },
  mac: {
    label: 'download for macos',
    meta: 'apple silicon · intel build below',
    asset: 'Zunify-mac-arm64.dmg',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.1.64-2.76 1.41-.57.65-1.07 1.7-1 2.76 1.07.08 2.14-.55 2.75-1.3z"/></svg>'
  },
  linux: {
    label: 'download for linux',
    meta: 'universal appimage · x64',
    asset: 'Zunify-linux-x86_64.AppImage',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c-2.2 0-3.5 1.9-3.5 4.4 0 1.5.4 2.5.4 3.6 0 1.4-2.9 4.2-2.9 7.3 0 .9.3 1.6.8 2.1M12 2c2.2 0 3.5 1.9 3.5 4.4 0 1.5-.4 2.5-.4 3.6 0 1.4 2.9 4.2 2.9 7.3 0 .9-.3 1.6-.8 2.1"/></svg>'
  }
};

document.documentElement.classList.remove('no-js');

document.addEventListener('DOMContentLoaded', () => {
  const os = detectOS();
  initDownloads(os);
  loadLatestRelease();
  initAccent();
  initNav();
  initTour();
  initReveal();
  initHeroTilt();
});

/* ---------- OS detection ---------- */
function detectOS() {
  const ua = navigator.userAgent || '';
  const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  if (/Mac|iPhone|iPad|iPod/i.test(platform) || /Mac OS X|Macintosh/i.test(ua)) return 'mac';
  if (/Win/i.test(platform) || /Windows/i.test(ua)) return 'windows';
  if (/Linux|X11|CrOS/i.test(platform + ua) && !/Android/i.test(ua)) return 'linux';
  return null; // phones/tablets: just send them to the download section
}

function initDownloads(os) {
  // Every download button points straight at the latest release asset
  document.querySelectorAll('[data-asset]').forEach(link => {
    link.href = LATEST_DOWNLOAD + link.dataset.asset;
  });

  if (!os) return;
  const info = OS_INFO[os];

  document.querySelectorAll('.js-primary-download').forEach(btn => {
    btn.href = LATEST_DOWNLOAD + info.asset;
  });
  document.querySelectorAll('.js-os-icon').forEach(el => { el.innerHTML = info.icon; });
  document.querySelectorAll('.js-primary-label').forEach(el => { el.textContent = info.label; });
  document.querySelectorAll('.js-primary-meta').forEach(el => { el.textContent = info.meta; });
  document.querySelector(`.dl-card[data-os="${os}"]`)?.classList.add('recommended');
}

/* ---------- Latest release (version label + exact asset URLs) ---------- */
async function loadLatestRelease() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!res.ok) return;
    const release = await res.json();
    const version = release.tag_name || '';

    if (version) {
      document.querySelectorAll('.js-version-badge').forEach(el => { el.textContent = version; });
      document.querySelectorAll('.js-version-text').forEach(el => { el.textContent = version; });
    }

    const assets = new Map((release.assets || []).map(a => [a.name, a]));
    document.querySelectorAll('[data-asset]').forEach(link => {
      const asset = assets.get(link.dataset.asset);
      if (!asset) return;
      link.href = asset.browser_download_url;
      const mb = Math.round(asset.size / 1048576);
      if (mb && !link.querySelector('.size')) {
        link.insertAdjacentHTML('beforeend', ` <span class="size" style="opacity:.6;font-weight:400">· ${mb} MB</span>`);
      }
    });
  } catch {
    // Offline or rate limited: the static /releases/latest/download links still work
  }
}

/* ---------- Accent switcher ---------- */
function initAccent() {
  const swatches = document.querySelectorAll('.swatch');
  let saved = null;
  try { saved = localStorage.getItem('zunify-site-accent'); } catch {}
  if (saved) setAccent(saved, false);
  else markActive(document.body.dataset.accent);

  swatches.forEach(s => s.addEventListener('click', () => setAccent(s.dataset.accent, true)));

  function setAccent(accent, persist) {
    document.body.dataset.accent = accent;
    markActive(accent);
    if (persist) {
      try { localStorage.setItem('zunify-site-accent', accent); } catch {}
    }
  }

  function markActive(accent) {
    swatches.forEach(s => {
      const on = s.dataset.accent === accent;
      s.classList.toggle('active', on);
      s.setAttribute('aria-checked', String(on));
    });
  }
}

/* ---------- Nav background on scroll ---------- */
function initNav() {
  const nav = document.getElementById('nav');
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* ---------- Pivot tour ---------- */
function initTour() {
  const items = document.querySelectorAll('.pivot-item');
  const img = document.getElementById('tour-img');
  const caption = document.getElementById('tour-caption');
  if (!img) return;

  // Warm the cache so switching screens is instant
  items.forEach(i => { const pre = new Image(); pre.src = i.dataset.img; });

  items.forEach(item => {
    item.addEventListener('click', () => {
      if (item.classList.contains('active')) return;
      items.forEach(i => {
        i.classList.toggle('active', i === item);
        i.setAttribute('aria-selected', String(i === item));
      });
      img.classList.add('fading');
      setTimeout(() => {
        img.src = item.dataset.img;
        img.alt = `Zunify ${item.textContent.trim()} screen`;
        caption.textContent = item.dataset.caption;
        img.classList.remove('fading');
      }, 200);
    });
  });
}

/* ---------- Reveal on scroll ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      // Stagger siblings that enter together
      const siblings = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'));
      el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 6) * 70}ms`;
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
}

/* ---------- Hero screenshot flattens as you scroll ---------- */
function initHeroTilt() {
  const shot = document.getElementById('hero-shot');
  if (!shot || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(max-width: 760px)').matches) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    if (!shot.classList.contains('in')) return;
    const rect = shot.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 when the shot's top sits at the bottom of the viewport, 1 when it reaches 25% from the top
    const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.75)));
    const angle = 14 * (1 - progress);
    const scale = 0.96 + 0.04 * progress;
    shot.style.transform = `rotateX(${angle.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  shot.addEventListener('transitionend', () => {
    shot.classList.remove('reveal');
    update();
  }, { once: true });
}
