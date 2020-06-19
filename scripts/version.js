const fs = require('fs');
const path = require('path');

function read(path) {
    return JSON.parse(fs.readFileSync(path, { flag: 'r' }).toString('utf-8'));
}

function write(path, data) {
    fs.writeFileSync(path, JSON.stringify(data));
}

const files = ['lerna.json', 'packages/desktop_app/package.json', 'packages/node_lib/package.json'];

const { version } = read(path.join(__dirname, '..', 'package.json'));

files
    .map(file => path.join(__dirname, '..', file))
    .forEach(filePath => {
        const data = read(filePath);
        data.version = version;
        write(filePath, data);
    });
