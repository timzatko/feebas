import { forkJoin, from, Observable, of } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';

import { Screenshots } from '../models/screenshots';
import getTempDir from './get-temp-dir';

import { PNG } from 'pngjs';
import * as pixelmatch from 'pixelmatch';
import * as fs from 'fs';
import * as path from 'path';

const asPNG = () => new PNG();

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
            });
        }

        const truthAbsolutePath = path.join(truth.path, truthRelativePath);

        const truthImage$ = from(
            new Promise<any>((resolve, reject) => {
                const img = fs
                    .createReadStream(currentAbsolutePath)
                    .pipe(asPNG())
                    .on('parsed', () => resolve(img))
                    .on('error', () => reject(img));
            }),
        );

        const currentImage$ = from(
            new Promise<any>((resolve, reject) => {
                const img = fs
                    .createReadStream(truthAbsolutePath)
                    .pipe(asPNG())
                    .on('parsed', () => resolve(img))
                    .on('error', () => reject(img));
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
                    return new Observable(observer => {
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
                    };
                }
            });

            return Object.values(screenshotsMap);
        }),
    );
};

export default compareScreenshots;
