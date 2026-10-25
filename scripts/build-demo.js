// Builds the Angular player and publishes it as the website's live browser demo (website/demo).
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
const playerDir = path.join(root, 'player');
const builtDir = path.join(playerDir, 'dist/zunify/browser');
const demoDir = path.join(root, 'website/demo');

cp.execSync('npm run build', { cwd: playerDir, stdio: 'inherit', shell: true });

// Replace the demo wholesale so stale hashed bundles from older builds don't linger
fs.rmSync(demoDir, { recursive: true, force: true });
fs.cpSync(builtDir, demoDir, { recursive: true });

console.log(`Demo copied to ${path.relative(root, demoDir)}`);
