const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const assets = path.join(root, 'assets');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  throw new Error('Missing dist/index.html. Run npm run build before npm run deploy:static.');
}

fs.copyFileSync(path.join(dist, 'index.html'), path.join(root, 'index.html'));
fs.rmSync(assets, { recursive: true, force: true });
fs.cpSync(path.join(dist, 'assets'), assets, { recursive: true });
