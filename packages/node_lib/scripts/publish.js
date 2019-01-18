const fs = require('fs-extra');
const path = require('path');

// copy README.md from the root directory
fs.copySync(path.join(__dirname, '../../../README.md'), path.join(__dirname, '../README.md'));
