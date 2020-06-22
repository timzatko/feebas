const fs = require('fs-extra');
const path = require('path');
const ncp = require('ncp');

// copy README.md from the root directory
fs.copySync(path.join(__dirname, '../../../README.md'), path.join(__dirname, '../README.md'));

// copy LICENSE from the root directory
fs.copySync(path.join(__dirname, '../../../LICENSE'), path.join(__dirname, '../LICENSE'));

// copy docs folder from the root directory
ncp(path.join(__dirname, '../../../docs'), path.join(__dirname, '../docs'), err => {
    if (err) {
        process.exit(1);
    }
});
