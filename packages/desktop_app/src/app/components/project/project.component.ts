import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { Router } from '@angular/router';
import { Screenshots } from '../../models/screenshots';
import { MatSnackBar } from '@angular/material';
import { LoaderService } from '../../services/loader.service';

@Component({
    selector: 'app-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.scss'],
})
export class ProjectComponent implements OnInit {
    currentScreenshot: Screenshots.Screenshot;

    constructor(
        public projectService: ProjectService,
        public router: Router,
        public snackBar: MatSnackBar,
        public loaderService: LoaderService,
    ) {}

    ngOnInit() {
        if (this.projectService.screenshots === null) {
            this.router.navigate(['/']);
        }
    }

    onOpenScreenshot(screenshot: Screenshots.Screenshot) {
        this.currentScreenshot = screenshot;
    }

    onCloseScreenshot() {
        this.currentScreenshot = null;
    }

    get filter() {
        return this.projectService.filter.getRawValue();
    }

    get selectedCount() {
        return Object.values(this.projectService.selected).filter(selected => selected).length;
    }

    onApproveClick() {
        this.loaderService.loading = true;

        this.projectService.push().subscribe(
            () => {
                this.loaderService.loading = false;
                this.snackBar.open('Success!', 'Close');
            },
            (error: Error) => {
                this.loaderService.loading = false;
                this.snackBar.open(error.message);
            },
        );
    }
}
