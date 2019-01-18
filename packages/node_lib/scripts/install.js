const os = require('os');
const path = require('path');
const fs = require('fs-extra');

const request = require('request');
const tempFile = require('tempfile');
const unzip7z = require('node-7z-forall');

const app = require('./../app');

const platform = os.platform();
const url = 'https://github.com/timzatko/feebas';
const feebas = require('./../package');

const unzip = filePath => {
    const folderName = tempFile();
    const unzip7zInstance = new unzip7z();
    return unzip7zInstance.extractFull(filePath, folderName).then(() => {
        return Promise.resolve(folderName);
    });
};

const getAppFileName = () => {
    const fileName = feebas['desktop_app-fileName'] + '-' + feebas['desktop_app-version'];
    if (platform === 'darwin') {
        return Promise.resolve(fileName + '-mac.7z');
    } else if (platform === 'linux') {
        return Promise.resolve(fileName + '-x86_64.AppImage');
    } else if (platform === 'win32') {
        return Promise.resolve(fileName + '.exe');
    }
    // TODO: other platforms
    return Promise.reject(`feebas is not available for platform  ${platform}`);
};

const downloadApp = appFileName => {
    if (process.argv.slice(2)[0] === '--dev') {
        console.log('opening feebas in the dev mode...');
        return Promise.resolve(path.join(__dirname, '../../desktop_app/release', appFileName));
    }

    return new Promise((resolve, reject) => {
        const fileUrl = url + '/releases/download/v' + feebas['desktop_app-version'] + '/' + appFileName;
        const tmpPath = tempFile();

        const cliProgress = require('cli-progress');
        console.log('Downloading feebas...');
        const bar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic);

        request.get(fileUrl).on('response', res => {
            if (res.statusCode !== 200) {
                reject(`[ERROR] Unable do download feebas app! (source at ${fileUrl} does not exist!)`);
            }
            bar.start(res.headers['content-length'], 0);

            res.on('data', chunk => {
                bar.increment(chunk.length);
            });

            // download file into tmp file
            const outStream = res.pipe(fs.createWriteStream(tmpPath));
            outStream.on('finish', () => {
                setTimeout(() => {
                    console.log('\n');
                    resolve(tmpPath);
                }, 1000);
            });
        });
    });
};

const installApp = appPath => {
    console.log('installing feebas from:', appPath);
    const outFile = path.join(outPath, app.platform[platform].appName);
    // remove old executables
    fs.removeSync(outPath);
    // and recreate executables folder
    fs.ensureDirSync(outPath);

    if (platform === 'darwin') {
        // on OSX unzip 7z file and move .app file from it
        return unzip(appPath).then(folderPath => {
            const osxFileName = feebas['desktop_app-fileName'] + '.app'; // feebas-desktop-app.app
            fs.moveSync(path.join(folderPath, osxFileName), outFile);
            return Promise.resolve();
        });
    }

    // just move downloaded file
    fs.moveSync(appPath, outFile);
    return Promise.resolve();
};

const onSuccess = () => {
    console.log('\n');
    console.log('feebas was successfuly installed!');
    process.exit(0);
};

const onError = error => {
    console.log(error.message);
    process.exit(0);
};

const outPath = path.join(__dirname, '../app');

getAppFileName()
    .then(downloadApp)
    .then(installApp)
    .then(onSuccess)
    .catch(onError);
