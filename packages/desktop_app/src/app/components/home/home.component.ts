import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { LoaderService } from '../../services/loader.service';
import { AppService } from '../../services/app.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
    form: FormGroup;
    projects: Project[];
    subscription: Subscription;

    constructor(
        public projectService: ProjectService,
        public appService: AppService,
        public snackBarService: MatSnackBar,
        public router: Router,
        public loaderService: LoaderService,
        public ngZone: NgZone,
    ) {
        this.form = new FormGroup({
            currentProject: new FormControl(projectService.currentProject),
        });
    }

    ngOnInit() {
        this.projects = this.appService.projects;

        this.subscription = this.projectService.projectChange.asObservable().subscribe(params => {
            if (params) {
                const currentProject = this.appService.projects.find(
                    ({ name }) => name === params.projectId,
                ) as Project;
                if (!currentProject) {
                    return this.snackBarService.open(
                        `Project with name "${params.projectId}" does not exist!`,
                        'Close',
                    );
                }
                this.form.setValue({ currentProject: currentProject });
                this.onSubmit(params.commitId);
            } else {
                if (this.projects.length === 1) {
                    this.onSubmit();
                }
            }
        });
    }

    onSubmit(commitId: string = null) {
        const { currentProject } = this.form.getRawValue();
        if (!currentProject) {
            return;
        }

        this.loaderService.loading = true;
        this.loaderService.message = 'fetching screenshots...';
        this.projectService.load(currentProject, commitId).subscribe(
            () => {
                this.ngZone.run(() => {
                    this.router.navigate(['/project']).then(() => {
                        this.loaderService.loading = false;
                    });
                });
            },
            (error: Error) => {
                this.ngZone.run(() => {
                    this.loaderService.loading = false;
                    this.snackBarService.open(error.message, 'Close');
                    console.error(error);
                });
            },
        );
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
