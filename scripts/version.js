const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

function read(path) {
    return JSON.parse(fs.readFileSync(path, { flag: 'r' }).toString('utf-8'));
}

function write(path, data) {
    fs.writeFileSync(path, JSON.stringify(data));
}

const files = ['lerna.json', 'packages/desktop_app/package.json', 'packages/node_lib/package.json'].map(file =>
    path.join(__dirname, '..', file)
);

const { version } = read(path.join(__dirname, '..', 'package.json'));

files.forEach(filePath => {
    const data = read(filePath);
    data.version = version;
    write(filePath, data);
});

child_process.exec(`cd ${path.join(__dirname, '..')} && npx prettier ${files.join(' ')} --write && git add .`, err => {
    if (err) {
        throw err;
    }
});
