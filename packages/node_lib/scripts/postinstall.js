const os = require('os');
const request = require('request');
const { join } = require('path');
const fs = require('fs-extra');
const tempFile = require('tempfile');
const unzip7z = require('node-7z-forall');

const app = require('./../app');

const platform = os.platform();
const url = 'https://github.com/timzatko/feebas';
const {
    version,
    name, // TODO: Rename package to feebas
} = require('./../package');

const unzip = (filePath, cb) => {
    const folderName = tempFile();
    const unzip7zInstance = new unzip7z();
    unzip7zInstance.extractFull(filePath, folderName).then(function() {
        cb(folderName);
    });
};

const getAppFileName = () => {
    const fileName = 'feebas-' + version;
    if (platform === 'darwin') {
        return fileName + '-mac.7z';
    }
    // TODO:
    console.log(`feebas is not available for platform  ${platform}`);
    process.exit(0);
    return null;
};

const exit = () => {
    console.log('\n');
    console.log('feebas was successfuly installed!');
    process.exit(0);
};

const fileUrl = url + '/releases/download/v' + version + '/' + getAppFileName();
const tmpPath = tempFile();
const outPath = join(__dirname, '../app');

const cliProgress = require('cli-progress');
console.log('Downloading feebas...');
const bar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic);

request.get(fileUrl).on('response', res => {
    if (res.statusCode !== 200) {
        console.error(`[ERROR] Unable do download feebas app! (source at ${fileUrl} does not exist!)`);
        process.exit(1);
    }
    bar.start(res.headers['content-length'], 0);

    res.on('data', chunk => {
        bar.increment(chunk.length);
    });

    const outStream = res.pipe(fs.createWriteStream(tmpPath));
    outStream.on('finish', () => {
        const appFileName = app.fileName[platform];
        fs.removeSync(outPath);
        fs.ensureDirSync(outPath);

        if (platform === 'darwin') {
            unzip(tmpPath, folderPath => {
                fs.moveSync(join(folderPath, appFileName), join(outPath, appFileName));
                exit();
            });
        } else if (platform === 'win32') {
            // TODO:
        } else {
            // TODO:
        }
    });
});
