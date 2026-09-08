const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML_TEMPLATE = path.resolve(__dirname, '../icon-render.html');
const TEMP_DIR = path.resolve(__dirname, '../scratch-icons');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// 1. Render 512x512 Master PNG
const masterPng = path.join(TEMP_DIR, 'icon-512.png');
console.log('Rendering 512x512 master PNG from icon-render.html...');

cp.execFileSync(CHROME_PATH, [
  '--headless=new',
  '--default-background-color=00000000',
  '--window-size=512,512',
  `--screenshot=${masterPng}`,
  `file:///${HTML_TEMPLATE.replace(/\\/g, '/')}`
]);

if (!fs.existsSync(masterPng) || fs.statSync(masterPng).size === 0) {
  throw new Error('Failed to render 512x512 master PNG');
}

console.log(`Master PNG rendered: ${fs.statSync(masterPng).size} bytes`);

// 2. High-quality Bicubic Resizing using .NET System.Drawing
function resizeWithNet(srcPath, width, height, destPath) {
  const psCmd = `
    Add-Type -AssemblyName System.Drawing;
    $src = [System.Drawing.Image]::FromFile('${srcPath.replace(/\\/g, '\\\\')}');
    $bmp = New-Object System.Drawing.Bitmap(${width}, ${height}, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb);
    $g = [System.Drawing.Graphics]::FromImage($bmp);
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality;
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic;
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality;
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality;
    $g.Clear([System.Drawing.Color]::Transparent);
    $g.DrawImage($src, 0, 0, ${width}, ${height});
    $g.Dispose();
    $src.Dispose();
    $bmp.Save('${destPath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png);
    $bmp.Dispose();
  `;
  cp.execFileSync('powershell', ['-NoProfile', '-Command', psCmd]);
}

const allSizes = [16, 32, 48, 64, 72, 96, 128, 144, 152, 192, 256, 384];
const pngBuffers = {
  512: fs.readFileSync(masterPng)
};

for (const s of allSizes) {
  const targetPath = path.join(TEMP_DIR, `icon-${s}.png`);
  resizeWithNet(masterPng, s, s, targetPath);
  pngBuffers[s] = fs.readFileSync(targetPath);
  console.log(`Resized to ${s}x${s}: ${pngBuffers[s].length} bytes`);
}

// 3. Build standard Windows .ico binary with [256, 128, 64, 48, 32, 16]
function createIco(sizes, buffers) {
  const count = sizes.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dataOffset = headerSize + count * dirEntrySize;

  let currentOffset = dataOffset;
  const entries = [];
  const imageBuffers = [];

  for (const size of sizes) {
    const buf = buffers[size];
    imageBuffers.push(buf);

    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // Width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // Height (0 = 256)
    entry.writeUInt8(0, 2); // Palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buf.length, 8); // Image size in bytes
    entry.writeUInt32LE(currentOffset, 12); // File offset

    entries.push(entry);
    currentOffset += buf.length;
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO type
  header.writeUInt16LE(count, 4); // Number of images

  return Buffer.concat([header, ...entries, ...imageBuffers]);
}

const icoBuffer = createIco([256, 128, 64, 48, 32, 16], pngBuffers);
console.log(`Built multi-resolution .ico: ${icoBuffer.length} bytes`);

// 4. Output Directories
const rootDir = path.resolve(__dirname, '..');
const playerBuildDir = path.join(rootDir, 'player/build');
const playerPublicDir = path.join(rootDir, 'player/public');
const playerIconsDir = path.join(rootDir, 'player/public/icons');

fs.mkdirSync(playerBuildDir, { recursive: true });
fs.mkdirSync(playerPublicDir, { recursive: true });
fs.mkdirSync(playerIconsDir, { recursive: true });

// Desktop build icons
fs.writeFileSync(path.join(playerBuildDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(playerBuildDir, 'icon.png'), pngBuffers[512]);

// Public runtime icons
fs.writeFileSync(path.join(playerPublicDir, 'favicon.ico'), icoBuffer);
fs.writeFileSync(path.join(playerPublicDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(playerPublicDir, 'icon.png'), pngBuffers[512]);

// PWA icons
const pwaSizes = [72, 96, 128, 144, 152, 192, 384, 512];
for (const s of pwaSizes) {
  fs.writeFileSync(path.join(playerIconsDir, `icon-${s}x${s}.png`), pngBuffers[s]);
}

// Cleanup
fs.rmSync(TEMP_DIR, { recursive: true, force: true });
if (fs.existsSync(HTML_TEMPLATE)) {
  fs.unlinkSync(HTML_TEMPLATE);
}

console.log('ALL ICONS SUCCESSFULLY GENERATED AND PLACED!');
