import { Component, NgZone, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { LoaderService } from '../../services/loader.service';
import { AppService } from '../../services/app.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
    form: FormGroup;
    projects: Project[];

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
        setTimeout(() => {
            if (this.projects.length === 1) {
                this.onSubmit();
            }
        });
    }

    onSubmit() {
        const { currentProject } = this.form.getRawValue();
        if (!currentProject) {
            return;
        }

        this.loaderService.loading = true;
        this.loaderService.message = 'fetching screenshots...';
        this.projectService.load().subscribe(
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
                });
                this.snackBarService.open(error.message, 'Close');
                console.error(error);
            },
        );
    }
}
