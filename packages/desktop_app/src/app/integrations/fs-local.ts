import { forkJoin, from, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatusResult } from 'simple-git/typings/response';

import { Integrations } from '../models/integrations';

import * as path from 'path';
import * as fs from 'fs-extra';
import * as simpleGit from 'simple-git/promise';
import * as gitRootDir from 'git-root-dir';

const pull: Integrations.actions.pull.Function<Integrations.FsLocal.Interface> = ({ env, integration }) => {
    const fullPath = path.join(env.cwd, integration.path);
    if (!fs.pathExistsSync(fullPath)) {
        return throwError(
            new Error(`[fs-local] Screenshots directory "${fullPath}" does not exist! Check your configuration file.`),
        );
    }
    return of({ path: fullPath });
};

const push: Integrations.actions.push.Function<Integrations.FsLocal.Interface> = ({
    integration,
    env,
    screenshots,
}) => {
    try {
        screenshots.forEach(screenshot => {
            if (screenshot.path.current) {
                const dst = path.join(env.cwd, integration.path, screenshot.key);
                fs.ensureDirSync(path.dirname(dst));
                fs.copyFileSync(screenshot.path.current, dst);
            }
        });
    } catch (e) {
        console.log(e);
        return throwError(e);
    }
    return of({ screenshots: screenshots });
};

const gitStatus: Integrations.actions.gitStatus.Function<Integrations.FsLocal.Interface> = ({ integration, env }) => {
    const fullPath = path.join(env.cwd, integration.path);
    const git = simpleGit(fullPath);
    const screenshotsDirectoryAbsolute = path.join(path.dirname(env.configPath), integration.path);

    return forkJoin(
        from(git.revparse(['HEAD'])),
        from(git.status()),
        from(gitRootDir(screenshotsDirectoryAbsolute)),
    ).pipe(
        map(([commitId, status, rootDir]: [string, StatusResult, string]) => {
            if (!rootDir) {
                throw new Error(`Cannot find git root directory for ${screenshotsDirectoryAbsolute}!`);
            }

            const relative = path.relative(rootDir, screenshotsDirectoryAbsolute);

            // change paths in git from relative to git root, to relative to integration screenshot directory
            ['modified', 'not_added', 'renamed', 'staged'].forEach(key => {
                status[key] = status[key].map(filePath => {
                    if (typeof filePath === 'string') {
                        return path.relative(relative, filePath);
                    } else {
                        // renamed status can be an object { from: 'path1', to: 'path2' }

                        for (const filePathKey in filePath) {
                            if (filePath.hasOwnProperty(filePathKey)) {
                                filePath[filePathKey] = path.relative(relative, filePath[filePathKey]);
                            }
                        }
                        return filePath;
                    }
                });
            });

            return { status, commitId: commitId.trim(), rootDir };
        }),
    );
};

const gitCheckout: Integrations.actions.gitCheckout.Function<Integrations.FsLocal.Interface> = ({
    integration,
    env,
    commitId,
}) => {
    const fullPath = path.join(env.cwd, integration.path);
    if (!fs.pathExistsSync(fullPath)) {
        return throwError(
            new Error(`[fs-local] Screenshots directory "${fullPath}" does not exist! Check your configuration file.`),
        );
    }
    const git = simpleGit(fullPath);
    return from(git.checkout(commitId));
};

const integrationResolver: Integrations.Resolver<Integrations.FsLocal.Interface> = {
    pull,
    push,
    gitStatus,
    gitCheckout,
};

export default integrationResolver;
