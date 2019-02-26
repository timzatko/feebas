import { Component, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { Router } from '@angular/router';
import { Screenshots } from '../../models/screenshots';
import { MatSnackBar } from '@angular/material';
import { LoaderService } from '../../services/loader.service';
import { ScreenshotItemComponent } from '../screenshot-item/screenshot-item.component';

@Component({
    selector: 'app-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.scss'],
})
export class ProjectComponent implements OnInit {
    currentScreenshot: Screenshots.Screenshot;

    @ViewChildren(ScreenshotItemComponent) screenshotItems: QueryList<ScreenshotItemComponent>;

    @HostListener('document:keyup', ['$event'])
    onKeyUp(event: KeyboardEvent) {
        if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
            let screenshots = this.projectService.filteredScreenshots;
            if (!screenshots.length) {
                return;
            } else if (!this.currentScreenshot) {
                this.currentScreenshot = screenshots[0];
                return;
            }

            // TODO: Fix, does not work on OSX
            // If the ctrlKey is pressed we navigate only through new screenshots
            // if (event.ctrlKey) {
            //     screenshots = screenshots.filter(
            //         screenshot =>
            //             screenshot.status === Screenshots.Status.truth_was_not_tested ||
            //             screenshot.status === Screenshots.Status.truth_does_not_exist,
            //     );
            // }

            if (event.shiftKey) {
                // If the shiftKey is pressed we navigate only through not matching screenshots
                screenshots = screenshots.filter(screenshot => screenshot.status === Screenshots.Status.do_not_match);
            }

            const currentIndex = screenshots.findIndex(screenshot => screenshot.key === this.currentScreenshot.key);
            // When the right key is pressed
            if (event.code === 'ArrowRight') {
                // If the test is not the last one
                if (currentIndex + 1 < screenshots.length) {
                    // Set it as a current test
                    this.currentScreenshot = screenshots[currentIndex + 1];
                } else {
                    // Else set as the current test the first test
                    this.currentScreenshot = screenshots[0];
                }
            } else if (event.code === 'ArrowLeft') {
                // When the left key is pressed
                if (currentIndex > 0) {
                    this.currentScreenshot = screenshots[currentIndex - 1];
                }
            }

            this.scrollIntoCurrentScreenshot();
        } else if (event.code === 'Backspace') {
            this.onCloseScreenshot();
        } else if (event.code === 'Enter') {
            if (this.currentScreenshot) {
                this.projectService.isCurrentProjectPreview = true;
            }
        }
    }

    constructor(
        public projectService: ProjectService,
        public router: Router,
        public snackBar: MatSnackBar,
        public loaderService: LoaderService,
    ) {}

    scrollIntoCurrentScreenshot() {
        if (this.currentScreenshot) {
            const screenshotItem = this.screenshotItems.find(
                item => item.screenshot.key === this.currentScreenshot.key,
            );
            if (screenshotItem) {
                setTimeout(() => {
                    screenshotItem.scrollIntoView();
                });
            }
        }
    }

    ngOnInit() {
        if (this.projectService.screenshots === null) {
            this.router.navigate(['/']);
        }
    }

    onOpenScreenshot(screenshot: Screenshots.Screenshot) {
        this.projectService.isCurrentProjectPreview = true;
        this.currentScreenshot = screenshot;
    }

    onCloseScreenshot() {
        this.projectService.isCurrentProjectPreview = false;
        this.scrollIntoCurrentScreenshot();
    }

    get filter() {
        return this.projectService.filter.getRawValue();
    }

    get selectedCount() {
        return Object.values(this.projectService.selected).filter(selected => selected).length;
    }

    get screenshots() {
        return this.projectService.filteredScreenshots;
    }

    onApproveClick() {
        this.loaderService.loading = true;

        this.projectService.push().subscribe(
            () => {
                this.loaderService.loading = false;
                this.projectService._selected.next({});
                this.snackBar.open('Success!', 'Close');
            },
            (error: Error) => {
                this.loaderService.loading = false;
                this.snackBar.open(error.message);
            },
        );
    }

    isHighlighted(screenshot: Screenshots.Screenshot) {
        return this.currentScreenshot && screenshot.key === this.currentScreenshot.key;
    }
}
