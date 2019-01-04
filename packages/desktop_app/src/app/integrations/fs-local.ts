import { forkJoin, from, of, throwError } from 'rxjs';
import { map, } from 'rxjs/operators';

import { Integrations } from '../models/integrations';

import * as path from 'path';
import * as fs from 'fs-extra';
import * as simpleGit from 'simple-git/promise';

const pull: Integrations.actions.pull.Function<Integrations.FsLocal.Interface> = ({ env, integration }) => {
    const fullPath = path.join(env.cwd, integration.path);
    if (!fs.pathExistsSync(fullPath)) {
        return throwError(
            new Error(`[fs-local] Screenshots directory "${fullPath}" does not exist! Check your configuration file.`),
        );
    }
    return of({ path: fullPath });
};

const push: Integrations.actions.push.Function<Integrations.FsLocal.Interface> = ({ screenshots }) => {
    try {
        screenshots.forEach(screenshot => {
            fs.copyFileSync(screenshot.path.current, screenshot.path.truth);
        });
    } catch (e) {
        console.log(e);
        return throwError(e);
    }
    return of({ screenshots: screenshots });
};

const gitStatus: Integrations.actions.gitStatus.Function<Integrations.FsLocal.Interface> = ({ integration, env }) => {
    const fullPath = path.join(env.cwd, integration.path);
    if (!fs.pathExistsSync(fullPath)) {
        return throwError(
            new Error(`[fs-local] Screenshots directory "${fullPath}" does not exist! Check your configuration file.`),
        );
    }
    const git = simpleGit(fullPath);

    return forkJoin(from(git.revparse(['HEAD'])), from(git.status())).pipe(
        map(([commitId, status]) => {
            return { status, commitId: commitId.trim() };
        }),
    );
};

const integrationResolver: Integrations.Resolver<Integrations.FsLocal.Interface> = {
    pull,
    push,
    gitStatus,
};

export default integrationResolver;
