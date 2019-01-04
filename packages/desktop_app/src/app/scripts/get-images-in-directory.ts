import * as klawSync from 'klaw-sync';
import * as path from 'path';

import { Screenshots } from '../models/screenshots';

const getImagesInDirectory = (fullPath: string, filter: Screenshots.Filter) => {
    const images = klawSync(fullPath, {
        nodir: true,
        traverseAll: true,
        filter: item => {
            const isIgnored = ['.gitkeep', '.gitignore', '.DS_Store'].some(
                ignored => path.basename(item.path) === ignored,
            );
            if (!filter) {
                return !isIgnored;
            } else if (isIgnored) {
                return false;
            }

            const userRuleMatch = filter.rules.some(rule =>
                new RegExp('^' + rule.split('*').join('.*') + '$').test(path.basename(item.path)),
            );
            return filter.strategy === 'whitelist' ? userRuleMatch : !userRuleMatch;
        },
    });

    return images.map(image => path.relative(fullPath, image.path));
};

export default getImagesInDirectory;
