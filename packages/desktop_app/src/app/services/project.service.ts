import { Injectable, NgZone } from '@angular/core';
import { AppService } from './app.service';
import { LoaderService } from './loader.service';
import { BehaviorSubject, forkJoin, from, Observable, of, throwError } from 'rxjs';
import { flatMap, map, take, tap } from 'rxjs/operators';
import getImagesInDirectory from '../scripts/get-images-in-directory';
import compareScreenshots from '../scripts/compare-screenshots';
import { Screenshots } from '../models/screenshots';
import { Project } from '../models/project';
import * as fs from 'fs';
import { FormControl, FormGroup } from '@angular/forms';
import integrations from '../integrations/integrations';
import { StatusResult as GitStatus } from 'simple-git/typings/response';
import { Router } from '@angular/router';

@Injectable()
export class ProjectService {
    projectChange = new BehaviorSubject<{ projectId: string; commitId: string }>(null);

    currentProject: Project;
    vcs: {
        commitId: string;
        status: GitStatus;
    } = { commitId: null, status: null };

    paths: { truth: string; current: string };

    _screenshots = new BehaviorSubject<Screenshots.Screenshot[]>(null);
    _selected = new BehaviorSubject<{ [key: string]: boolean }>({});

    filter = new FormGroup({
        match: new FormControl(false),
        do_not_match: new FormControl(true),
        truth_was_not_tested: new FormControl(true),
        truth_does_not_exist: new FormControl(true),
    });

    private _compareScreenshots() {
        const screenshots = {
            current: getImagesInDirectory(this.paths.current, this.currentProject.screenshots.current.filter),
            truth: getImagesInDirectory(this.paths.truth, this.currentProject.screenshots.truth.filter),
        };

        return compareScreenshots(
            { path: this.paths.current, screenshots: screenshots.current },
            { path: this.paths.truth, screenshots: screenshots.truth },
        );
    }

    constructor(
        public appService: AppService,
        public loaderService: LoaderService,
        public router: Router,
        public ngZone: NgZone,
    ) {
        if (this.appService.projects.length) {
            this.currentProject = this.appService.projects[0];
        }

        this.appService.electronService.ipcRenderer.on('open-url', (_, url) => {
            console.log('open-url - ' + url);
            const [projectId, commitId] = url
                .toString()
                .split('//')[1]
                .split(':');

            this.currentProject = null;
            this.ngZone.run(() =>
                from(this.router.navigate(['home']))
                    .pipe(take(1))
                    .subscribe(() => {
                        this.projectChange.next({ projectId, commitId });
                    }),
            );
        });
    }

    get screenshots() {
        return this._screenshots.getValue();
    }

    set screenshots(value: Screenshots.Screenshot[]) {
        this._screenshots.next(value);
    }

    get selected() {
        return this._selected.getValue();
    }

    set selected(value: { [key: string]: boolean }) {
        this._selected.next({ ...this.selected, ...value });
    }

    get status() {
        return this.screenshots.reduce((_status, { status }) => Math.max(_status, status), Screenshots.Status.match);
    }

    get filterChange(): Observable<Screenshots.Screenshot[]> {
        return this.filter.valueChanges.pipe(
            map(() => {
                return this.filteredScreenshots;
            }),
        );
    }

    get filteredScreenshots() {
        const filter = this.filter.getRawValue();
        return (this.screenshots || []).filter(({ status }) => {
            return Object.keys(filter)
                .filter(key => filter[key])
                .some(key => status === Screenshots.Status[key]);
        });
    }

    gitCheckout(commitId: string) {
        return integrations.gitCheckout({
            integration: this.currentProject.screenshots.truth,
            env: this.appService.env,
            commitId,
        });
    }

    getGitStatus() {
        return integrations.gitStatus({
            integration: this.currentProject.screenshots.truth,
            env: this.appService.env,
        });
    }

    load(project: Project, _commitId: string) {
        this.currentProject = project;
        return this.getGitStatus()
            .pipe(
                flatMap(params => {
                    if (params.commitId !== _commitId) {
                        return this.gitCheckout(_commitId).pipe(map(() => params));
                    }
                    return of(params);
                }),
            )
            .pipe(
                flatMap(({ commitId, status }) => {
                    this.vcs = { commitId, status };
                    return this.getScreenshots(commitId);
                }),
            );
    }

    getScreenshots(commitId: string) {
        this.screenshots = null;

        return forkJoin(
            integrations.pull({
                integration: this.currentProject.screenshots.current,
                commitId: commitId,
                env: this.appService.env,
            }),
            integrations.pull({
                integration: this.currentProject.screenshots.truth,
                commitId: commitId,
                env: this.appService.env,
            }),
        )
            .pipe(
                flatMap(([current, truth]) => {
                    this.paths = { current: current.path, truth: truth.path };
                    this.loaderService.message = 'comparing screenshots...';

                    return this._compareScreenshots();
                }),
            )
            .pipe(
                tap(screenshots => {
                    this.screenshots = screenshots;

                    // if the test is success don't filter out success screenshots
                    if (this.status === Screenshots.Status.match) {
                        this.filter.patchValue({ match: true });
                    }
                }),
            );
    }

    push() {
        const selected = this.selected;
        const selectedScreenshots = this.filteredScreenshots.filter(({ key }) => selected[key]);

        this.screenshots = null;

        if (!selectedScreenshots.length) {
            return throwError(new Error('No screenshots selected!'));
        }

        this.loaderService.message = 'approving screenshots...';

        return integrations
            .push({
                integration: this.currentProject.screenshots.truth,
                commitId: this.vcs.commitId,
                env: this.appService.env,
                screenshots: selectedScreenshots,
            })
            .pipe(
                flatMap(() => {
                    this.loaderService.message = 'comparing screenshots...';
                    return this._compareScreenshots();
                }),
            )
            .pipe(
                tap(screenshots => {
                    this._screenshots.next(screenshots);
                }),
            );
    }

    getLocalImageBase64(filePath: string) {
        return 'data:image/png;base64,' + fs.readFileSync(filePath).toString('base64');
    }
}
