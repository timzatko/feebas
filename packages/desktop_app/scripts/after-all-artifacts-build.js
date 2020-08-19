const path = require('path');
const tar = require('tar');

const version = require('../package.json').version;

module.exports = async function (buildResult) {
    const toPublish = [];
    const { configuration, outDir } = buildResult;

    if ('mac' in configuration) {
        const { target } = configuration.mac;

        if (target.indexOf('dir') !== -1) {
            const tarPath = path.join(outDir, configuration.productName + '-' + version + '-mac.tar.gz');

            await tar.create({ file: tarPath, cwd: path.join(outDir, 'mac'), gzip: true }, [
                configuration.productName + '.app',
            ]);

            toPublish.push(tarPath);
        }
    }

    return toPublish;
};
