const os = require('os');
const path = require('path');
const fs = require('fs-extra');

const request = require('request');
const tmp = require('tmp');
const tar = require('tar');

const app = require('./../app');

const platform = os.platform();
const feebas = require('./../package');

const unzip = filePath => {
    const target = tmp.dirSync().name;

    return tar
        .extract({
            file: filePath,
            cwd: target,
        })
        .then(() => {
            return Promise.resolve(target);
        });
};

const getAppFileName = () => {
    const fileName = feebas['desktopApp'] + '-' + feebas['version'];
    if (platform === 'darwin') {
        return Promise.resolve(fileName + '-mac.tar.gz');
    } else if (platform === 'linux') {
        return Promise.resolve(fileName + '-x86_64.AppImage');
    } else if (platform === 'win32') {
        return Promise.resolve(fileName + '.exe');
    }
    return Promise.reject(`feebas is not available for platform ${platform}`);
};

const downloadApp = appFileName => {
    if (process.argv.slice(2)[0] === '--dev') {
        console.log('opening feebas in the dev mode...');
        return Promise.resolve(path.join(__dirname, '../../desktop_app/release', appFileName));
    }

    return new Promise((resolve, reject) => {
        const fileUrl =
            feebas.repository.url.replace(/(git\+|\.git)/g, '') +
            '/releases/download/v' +
            feebas['version'] +
            '/' +
            appFileName;
        const tmpPath = tmp.fileSync().name;

        const cliProgress = require('cli-progress');
        console.log('Downloading feebas...');
        const bar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic);

        request.get(fileUrl).on('response', res => {
            if (res.statusCode !== 200) {
                reject(`[ERROR] Unable do download feebas app! (source at ${fileUrl} does not exist!)`);

                // do not exit with error since the npm install would fail
                process.exit(0);
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
            const osxFileName = feebas['desktopApp'] + '.app'; // feebas-desktop-app.app
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
    console.log('feebas was successfully installed!');
    process.exit(0);
};

const onError = error => {
    const errorMessage = error.message || error;
    console.error('\n');
    console.error('installation of feebas failed with error', errorMessage);
    process.exit(2);
};

const outPath = path.join(__dirname, '../app');

module.exports = function () {
    return getAppFileName().then(downloadApp).then(installApp).then(onSuccess).catch(onError);
};
