const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT_DIR = path.resolve(__dirname, '..');
const SVG_PATH = path.join(ROOT_DIR, 'doc-images/logo.svg');
const TEMP_DIR = path.join(ROOT_DIR, 'scratch-icons');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// 1. Render 512x512 Master PNG directly from doc-images/logo.svg
const masterPng = path.join(TEMP_DIR, 'icon-512.png');
console.log('Rendering 512x512 master PNG from doc-images/logo.svg...');

cp.execFileSync(CHROME_PATH, [
  '--headless=new',
  '--default-background-color=00000000',
  '--window-size=512,512',
  `--screenshot=${masterPng}`,
  `file:///${SVG_PATH.replace(/\\/g, '/')}`
]);

if (!fs.existsSync(masterPng) || fs.statSync(masterPng).size === 0) {
  throw new Error('Failed to render 512x512 master PNG');
}

console.log(`Master PNG rendered: ${fs.statSync(masterPng).size} bytes`);

// 2. Generate multi-resolution Windows executable .ico using png2icons (BMP for <=48, PNG for >=64)
const icoBase = path.join(TEMP_DIR, 'icon');
const targetIco = path.join(TEMP_DIR, 'icon.ico');

console.log('Generating Windows executable-compliant multi-resolution .ico...');
cp.execFileSync('npx', ['-y', 'png2icons', `"${masterPng}"`, `"${icoBase}"`, '-icowe', '-bc', '-i'], {
  shell: true
});

if (!fs.existsSync(targetIco) || fs.statSync(targetIco).size === 0) {
  throw new Error('Failed to generate compliant .ico file');
}

console.log(`Compliant Windows .ico generated: ${fs.statSync(targetIco).size} bytes`);

const icoBuffer = fs.readFileSync(targetIco);
const masterPngBuffer = fs.readFileSync(masterPng);

// 3. High-quality Bicubic Resizing using .NET System.Drawing for PWA icons
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
  512: masterPngBuffer
};

for (const s of allSizes) {
  const targetPath = path.join(TEMP_DIR, `icon-${s}.png`);
  resizeWithNet(masterPng, s, s, targetPath);
  pngBuffers[s] = fs.readFileSync(targetPath);
  console.log(`Resized to ${s}x${s}: ${pngBuffers[s].length} bytes`);
}

// 4. Output Directories
const playerBuildDir = path.join(ROOT_DIR, 'player/build');
const playerPublicDir = path.join(ROOT_DIR, 'player/public');
const websiteDemoDir = path.join(ROOT_DIR, 'website/demo');

fs.mkdirSync(playerBuildDir, { recursive: true });
fs.mkdirSync(playerPublicDir, { recursive: true });
fs.mkdirSync(websiteDemoDir, { recursive: true });

// Desktop build icons
fs.writeFileSync(path.join(playerBuildDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(playerBuildDir, 'icon.png'), masterPngBuffer);

// Public runtime icons for Player
fs.writeFileSync(path.join(playerPublicDir, 'favicon.ico'), icoBuffer);
fs.writeFileSync(path.join(playerPublicDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(playerPublicDir, 'icon.png'), masterPngBuffer);

// Demo site icons
fs.writeFileSync(path.join(websiteDemoDir, 'favicon.ico'), icoBuffer);
fs.writeFileSync(path.join(websiteDemoDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(websiteDemoDir, 'icon.png'), masterPngBuffer);

// Cleanup temporary scratch files
fs.rmSync(TEMP_DIR, { recursive: true, force: true });

console.log('ALL ICONS SUCCESSFULLY GENERATED AND PLACED!');
