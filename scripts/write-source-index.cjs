const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
fs.copyFileSync(path.join(root, 'index.template.html'), path.join(root, 'index.html'));
