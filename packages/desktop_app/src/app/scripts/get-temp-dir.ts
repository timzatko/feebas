import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

const fullPath = path.join(os.tmpdir(), '.visual-testing');

const getTempDir = (subDirectory: string = null) => {
    const _fullPath = subDirectory ? path.join(fullPath, subDirectory) : fullPath;
    fs.ensureDirSync(_fullPath);
    return _fullPath;
};

export default getTempDir;
