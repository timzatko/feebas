import { forkJoin, from, Observable, of } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';

import { Screenshots } from '../models/screenshots';
import getTempDir from './get-temp-dir';

import { PNG } from 'pngjs';
import * as pixelmatch from 'pixelmatch';
import * as fs from 'fs';
import * as path from 'path';
import * as log from 'electron-log';

import GitStatus = Screenshots.GitStatus;

const asPNG = () => new PNG();

interface Image {
    width: number;
    height: number;
    data: any;
}

const compareScreenshots = (
    current: { path: Screenshots.Directory; screenshots: Screenshots.RelativePath[] },
    truth: { path: Screenshots.Directory; screenshots: Screenshots.RelativePath[] },
): Observable<Screenshots.Screenshot[]> => {
    const compareCurrentScreenshot = (currentRelativePath: string): Observable<Screenshots.Screenshot> => {
        const currentAbsolutePath = path.join(current.path, currentRelativePath);
        const truthRelativePath = truth.screenshots.find(
            _truthRelativePath => _truthRelativePath === currentRelativePath,
        );

        if (!truthRelativePath) {
            return of({
                key: currentRelativePath,
                path: { current: currentAbsolutePath },
                status: Screenshots.Status.truth_does_not_exist,
                gitStatus: GitStatus.not_changed,
            });
        }

        const truthAbsolutePath = path.join(truth.path, truthRelativePath);

        const truthImage$ = from(
            new Promise<Image>((resolve, reject) => {
                log.info(`[compare screenshots] reading truth screenshot from ${truthAbsolutePath}`);

                const img = fs
                    .createReadStream(truthAbsolutePath)
                    .pipe(asPNG())
                    .on('parsed', () => resolve(img))
                    .on('error', e => reject(e));
            }),
        );

        const currentImage$ = from(
            new Promise<Image>((resolve, reject) => {
                log.info(`[compare screenshots] reading current screenshot from ${currentAbsolutePath}`);

                const img = fs
                    .createReadStream(currentAbsolutePath)
                    .pipe(asPNG())
                    .on('parsed', () => resolve(img))
                    .on('error', e => reject(e));
            }),
        );

        return forkJoin(truthImage$, currentImage$).pipe(
            flatMap(([truthImage, currentImage]) => {
                const diffScreenshot = new PNG({ width: truthImage.width, height: truthImage.height });

                const diffPx = pixelmatch(
                    truthImage.data,
                    currentImage.data,
                    diffScreenshot.data,
                    truthImage.width,
                    currentImage.height,
                    {
                        threshold: 0,
                    },
                );

                if (diffPx > 0) {
                    return new Observable<Screenshots.Screenshot>(observer => {
                        const diffPath = getTempDir(path.join('/diff', path.dirname(currentRelativePath)));
                        const diffFile = path.join(diffPath, path.basename(currentRelativePath));
                        const out = diffScreenshot.pack().pipe(fs.createWriteStream(diffFile));

                        out.on('finish', () => {
                            observer.next({
                                key: currentRelativePath,
                                path: {
                                    current: currentAbsolutePath,
                                    truth: truthAbsolutePath,
                                    diff: diffFile,
                                },
                                status: Screenshots.Status.do_not_match,
                                gitStatus: GitStatus.not_changed,
                            });
                            observer.complete();
                        });
                    });
                }

                return of({
                    key: currentRelativePath,
                    path: {
                        current: currentAbsolutePath,
                        truth: truthAbsolutePath,
                    },
                    status: Screenshots.Status.match,
                    gitStatus: GitStatus.not_changed,
                });
            }),
        );
    };

    return forkJoin(current.screenshots.map(compareCurrentScreenshot)).pipe(
        map(screenshots => {
            const screenshotsMap: { [key: string]: Screenshots.Screenshot } = screenshots.reduce((obj, screenshot) => {
                obj[screenshot.key] = screenshot;
                return obj;
            }, {});

            truth.screenshots.forEach(truthRelativePath => {
                if (!screenshotsMap.hasOwnProperty(truthRelativePath)) {
                    screenshotsMap[truthRelativePath] = {
                        key: truthRelativePath,
                        path: { truth: path.join(truth.path, truthRelativePath) },
                        status: Screenshots.Status.truth_was_not_tested,
                        gitStatus: GitStatus.not_changed,
                    };
                }
            });

            return Object.values(screenshotsMap);
        }),
    );
};

export default compareScreenshots;
