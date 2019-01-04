import * as path from 'path';

import getTempDir from './get-temp-dir';

const getIntegrationTempDir = (type: string, subDirectory: string = null) => {
    let _path = ['integrations', type, subDirectory];
    if (!subDirectory) {
        _path = _path.slice(-1, 1);
    }
    return getTempDir(path.join(..._path));
};

export default getIntegrationTempDir;
