/**
 * Zunify Desktop Product Website - Controller
 * - Dynamic OS detection for smart platform downloads
 * - Visual Tour Gallery tabs switcher
 * - Platform selection modal
 * - Download toast notifications
 */

document.addEventListener('DOMContentLoaded', () => {
  initOSDetection();
  initGalleryTabs();
  initPlatformModal();
  initDownloadToasts();
  initHeroMusicParticles();
});

/* ==========================================================================
   1. DYNAMIC OS DETECTION
   ========================================================================== */
function initOSDetection() {
  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';
  
  let detectedOS = 'windows'; // default fallback

  if (/Mac|iPhone|iPod|iPad/i.test(platform) || /Macintosh|Mac OS X/i.test(userAgent)) {
    detectedOS = 'mac';
  } else if (/Linux/i.test(platform) || /Linux|X11/i.test(userAgent)) {
    detectedOS = 'linux';
  } else if (/Win/i.test(platform) || /Windows/i.test(userAgent)) {
    detectedOS = 'windows';
  }

  const heroBtn = document.getElementById('hero-download-btn');
  const heroTitle = document.getElementById('hero-download-title');
  const heroMeta = document.getElementById('hero-download-meta');
  const heroIcon = document.getElementById('hero-os-icon');

  const headerBtn = document.getElementById('header-download-btn');
  const headerText = document.getElementById('header-download-text');
  const headerIcon = document.getElementById('header-os-icon');

  const releaseBase = 'https://github.com/breejesh/zunify/releases/download/v1.0.0/';

  if (detectedOS === 'mac') {
    const macUrl = releaseBase + 'Zunify-1.0.0-arm64.dmg';
    const macFilename = 'Zunify-1.0.0-arm64.dmg';
    const macSvg = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.1.64-2.76 1.41-.57.65-1.07 1.7-1 2.76 1.07.08 2.14-.55 2.75-1.3z"/></svg>`;

    if (heroBtn) {
      heroTitle.textContent = 'Download for macOS';
      heroMeta.textContent = 'v1.0.0 • Apple Silicon & Intel (.dmg) • macOS 11+';
      heroBtn.href = macUrl;
      heroBtn.setAttribute('data-filename', macFilename);
      heroIcon.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.1.64-2.76 1.41-.57.65-1.07 1.7-1 2.76 1.07.08 2.14-.55 2.75-1.3z"/></svg>`;
    }
    if (headerBtn) {
      headerBtn.href = macUrl;
      headerBtn.setAttribute('data-filename', macFilename);
      if (headerText) headerText.textContent = 'Download for macOS';
      if (headerIcon) headerIcon.innerHTML = macSvg;
    }
    document.getElementById('card-mac')?.classList.add('highlight');
  } else if (detectedOS === 'linux') {
    const linuxUrl = releaseBase + 'Zunify-1.0.0.AppImage';
    const linuxFilename = 'Zunify-1.0.0.AppImage';
    const linuxSvg = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.001 0C8.135 0 5.484 2.812 5.484 6.875c0 1.258.267 2.664.73 3.914-.54 1.34-1.066 3.125-1.066 4.71 0 3.738 2.505 5.501 5.043 5.501.272 0 .54-.025.807-.075.768 1.83 2.196 3.075 4.002 3.075 1.805 0 3.234-1.245 4.002-3.075.267.05.535.075.807.075 2.538 0 5.043-1.763 5.043-5.5 0-1.586-.525-3.371-1.065-4.711.463-1.25.73-2.656.73-3.914C24.517 2.812 21.866 0 18 0c-2.316 0-4.316 1.054-5.999 2.766C10.317 1.054 8.317 0 5.999 0h6.002z"/></svg>`;

    if (heroBtn) {
      heroTitle.textContent = 'Download for Linux';
      heroMeta.textContent = 'v1.0.0 • Universal AppImage (.AppImage)';
      heroBtn.href = linuxUrl;
      heroBtn.setAttribute('data-filename', linuxFilename);
      heroIcon.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12.001 0C8.135 0 5.484 2.812 5.484 6.875c0 1.258.267 2.664.73 3.914-.54 1.34-1.066 3.125-1.066 4.71 0 3.738 2.505 5.501 5.043 5.501.272 0 .54-.025.807-.075.768 1.83 2.196 3.075 4.002 3.075 1.805 0 3.234-1.245 4.002-3.075.267.05.535.075.807.075 2.538 0 5.043-1.763 5.043-5.5 0-1.586-.525-3.371-1.065-4.711.463-1.25.73-2.656.73-3.914C24.517 2.812 21.866 0 18 0c-2.316 0-4.316 1.054-5.999 2.766C10.317 1.054 8.317 0 5.999 0h6.002z"/></svg>`;
    }
    if (headerBtn) {
      headerBtn.href = linuxUrl;
      headerBtn.setAttribute('data-filename', linuxFilename);
      if (headerText) headerText.textContent = 'Download for Linux';
      if (headerIcon) headerIcon.innerHTML = linuxSvg;
    }
    document.getElementById('card-linux')?.classList.add('highlight');
  } else {
    // Windows
    const winUrl = releaseBase + 'Zunify-Setup-1.0.0.exe';
    const winFilename = 'Zunify-Setup-1.0.0.exe';
    const winSvg = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.902-1.801"/></svg>`;

    if (heroBtn) {
      heroTitle.textContent = 'Download for Windows';
      heroMeta.textContent = 'v1.0.0 • 64-bit Installer (.exe) • Windows 10/11';
      heroBtn.href = winUrl;
      heroBtn.setAttribute('data-filename', winFilename);
    }
    if (headerBtn) {
      headerBtn.href = winUrl;
      headerBtn.setAttribute('data-filename', winFilename);
      if (headerText) headerText.textContent = 'Download for Windows';
      if (headerIcon) headerIcon.innerHTML = winSvg;
    }
    document.getElementById('card-windows')?.classList.add('highlight');
  }
}

/* ==========================================================================
   2. GALLERY TABS
   ========================================================================== */
function initGalleryTabs() {
  const tabs = document.querySelectorAll('.gallery-tab-btn');
  const mainImg = document.getElementById('gallery-main-img');
  const caption = document.getElementById('gallery-caption');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const imgSrc = tab.dataset.img;
      const desc = tab.dataset.desc;

      mainImg.style.opacity = '0.3';
      setTimeout(() => {
        mainImg.src = imgSrc;
        mainImg.style.opacity = '1';
        caption.textContent = desc;
      }, 150);
    });
  });
}

/* ==========================================================================
   3. PLATFORM SELECTION MODAL
   ========================================================================== */
function initPlatformModal() {
  const modal = document.getElementById('platform-modal');
  const openBtn = document.getElementById('open-platform-modal');
  const closeBtn = document.getElementById('close-platform-modal');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.classList.add('active');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}

/* ==========================================================================
   4. DOWNLOAD TOAST NOTIFICATION
   ========================================================================== */
function initDownloadToasts() {
  const links = document.querySelectorAll('.download-file-link, .modal-dl-link, #hero-download-btn');
  const toast = document.getElementById('download-toast');
  const toastFile = document.getElementById('toast-filename');

  let toastTimer = null;

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const filename = link.getAttribute('data-filename') || link.href.split('/').pop() || 'Zunify-Setup-1.0.0.exe';
      toastFile.textContent = filename;
      toast.classList.add('show');

      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 4000);
    });
  });
}

/* ==========================================================================
   5. INTERACTIVE HERO MUSICAL STARDUST & NOTE TRAIL
   ========================================================================== */
function initHeroMusicParticles() {
  const canvas = document.getElementById('hero-sound-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const heroSection = canvas.closest('.hero-section-epic');
  if (!ctx || !heroSection) return;

  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;

  function resize() {
    const rect = heroSection.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }

  resize();
  window.addEventListener('resize', resize);

  const particles = [];
  const musicalSymbols = ['♩', '♪', '♫', '♬', '𝄞'];
  
  let mouse = {
    x: width / 2,
    y: height / 2,
    prevX: width / 2,
    prevY: height / 2,
    speed: 0,
    isHovering: false
  };

  // Persistent ambient cosmic dust drifting in the hero atmosphere
  const ambientDust = [];
  const AMBIENT_COUNT = 30;
  for (let i = 0; i < AMBIENT_COUNT; i++) {
    ambientDust.push({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 600),
      size: 1.5 + Math.random() * 2.5,
      speedY: -0.15 - Math.random() * 0.35,
      speedX: (Math.random() - 0.5) * 0.3,
      alpha: 0.2 + Math.random() * 0.6,
      pulseSpeed: 0.02 + Math.random() * 0.03,
      pulsePhase: Math.random() * Math.PI * 2
    });
  }

  heroSection.addEventListener('mouseenter', (e) => {
    const rect = heroSection.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
    mouse.isHovering = true;
  });

  heroSection.addEventListener('mouseleave', () => {
    mouse.isHovering = false;
  });

  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    const nx = e.clientX - rect.left;
    const ny = e.clientY - rect.top;
    const dx = nx - mouse.x;
    const dy = ny - mouse.y;
    mouse.speed = Math.sqrt(dx * dx + dy * dy);
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
    mouse.x = nx;
    mouse.y = ny;
    mouse.isHovering = true;

    // Emit interactive cursor trail particles
    const spawnCount = Math.min(Math.floor(mouse.speed * 0.2) + 1, 4);
    for (let i = 0; i < spawnCount; i++) {
      spawnParticle(
        mouse.x + (Math.random() - 0.5) * 14,
        mouse.y + (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 1.5 + (dx * 0.07),
        (Math.random() - 0.5) * 1.5 + (dy * 0.07) - 0.5,
        false
      );
    }
  });

  function spawnParticle(x, y, vx, vy, isAmbient = false) {
    if (particles.length > 150) particles.shift();

    const isSymbol = Math.random() < (isAmbient ? 0.45 : 0.3);
    const symbol = isSymbol ? musicalSymbols[Math.floor(Math.random() * musicalSymbols.length)] : null;
    const hue = 325 + Math.random() * 25; // Zune magenta & vibrant pink
    const size = isSymbol ? (12 + Math.random() * 8) : (3.5 + Math.random() * 5);
    const life = 1.0;
    const decay = isAmbient ? (0.005 + Math.random() * 0.008) : (0.014 + Math.random() * 0.018);

    particles.push({
      x,
      y,
      vx,
      vy,
      size,
      alpha: 1.0,
      decay,
      isSymbol,
      symbol,
      hue,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.06
    });
  }

  // Periodic subtle ambient acoustic notes drifting from disc
  let tick = 0;
  function addAmbientNote() {
    tick++;
    if (tick % 20 === 0) {
      const centerX = width / 2;
      const centerY = 200;
      const angle = Math.random() * Math.PI * 2;
      const radius = 120 + Math.random() * 100;
      const px = centerX + Math.cos(angle) * radius;
      const py = centerY + Math.sin(angle) * radius;
      spawnParticle(
        px,
        py,
        Math.cos(angle) * 0.35 + (Math.random() - 0.5) * 0.2,
        -0.7 - Math.random() * 0.6,
        true
      );
    }
  }

  let animationFrameId;
  function animate() {
    ctx.clearRect(0, 0, width, height);

    // 1. Subtle alive cosmic dust in background
    for (let i = 0; i < ambientDust.length; i++) {
      const d = ambientDust[i];
      d.y += d.speedY;
      d.x += d.speedX;
      d.pulsePhase += d.pulseSpeed;

      if (d.y < -10) d.y = height + 10;
      if (d.x < -10) d.x = width + 10;
      if (d.x > width + 10) d.x = -10;

      const currentAlpha = d.alpha * (0.5 + 0.5 * Math.sin(d.pulsePhase));
      ctx.save();
      ctx.fillStyle = `rgba(255, 80, 180, ${currentAlpha})`;
      ctx.shadowColor = 'rgba(229, 0, 125, 0.4)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Ambient acoustic notes from disc
    addAmbientNote();

    // 3. Render active cursor particles & notes
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y < -50 || p.x < -50 || p.x > width + 50) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.isSymbol) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `${p.size}px Outfit, 'Segoe UI Symbol', sans-serif`;
        ctx.fillStyle = `hsl(${p.hue}, 100%, 75%)`;
        ctx.shadowColor = 'rgba(229, 0, 125, 0.85)';
        ctx.shadowBlur = 14;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.symbol, 0, 0);
      } else {
        // Glowing sonic stardust (pure soft pink/magenta, no white dots)
        const radGrd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        radGrd.addColorStop(0, `hsla(${p.hue}, 100%, 65%, ${p.alpha * 0.85})`);
        radGrd.addColorStop(0.5, `hsla(${p.hue}, 95%, 50%, ${p.alpha * 0.45})`);
        radGrd.addColorStop(1, 'rgba(229, 0, 125, 0)');

        ctx.fillStyle = radGrd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  animate();
}

