import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { LoaderService } from './loader.service';
import { BehaviorSubject, forkJoin, Observable, throwError } from 'rxjs';
import { flatMap, map, tap } from 'rxjs/operators';
import getImagesInDirectory from '../scripts/get-images-in-directory';
import compareScreenshots from '../scripts/compare-screenshots';
import { Screenshots } from '../models/screenshots';
import { Project } from '../models/project';
import * as fs from 'fs';
import { FormControl, FormGroup } from '@angular/forms';
import integrations from '../integrations/integrations';
import { StatusResult as GitStatus } from 'simple-git/typings/response';

@Injectable()
export class ProjectService {
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

    constructor(public appService: AppService, public loaderService: LoaderService) {
        if (this.appService.projects.length) {
            this.currentProject = this.appService.projects[0];
        }
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
        return this.screenshots.filter(({ status }) => {
            return Object.keys(filter)
                .filter(key => filter[key])
                .some(key => status === Screenshots.Status[key]);
        });
    }

    getGitStatus() {
        return integrations.gitStatus({
            integration: this.currentProject.screenshots.truth,
            env: this.appService.env,
        });
    }

    load() {
        return this.getGitStatus().pipe(
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
            // of({
            //     path:
            //         '/var/folders/55/cprtpc9x4835bg4yj7mj0bww0000gn/T/.visual-testing/integrations/gitlab/commits/' +
            //         this.commitId,
            // }),
            // of({ path: '/Users/timzatko/Documents/WORKSPACE/frontend/snapshot_testing/truth_screenshots' }),
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
        const selectedScreenshots = this.screenshots.filter(({ key }) => selected[key]);

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
