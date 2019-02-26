import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Screenshots } from '../../models/screenshots';
import { ProjectService } from '../../services/project.service';
import { getScreenshotClass } from '../../scripts/screenshot';

@Component({
    selector: 'app-screenshot',
    templateUrl: './screenshot.component.html',
    styleUrls: ['./screenshot.component.scss'],
})
export class ScreenshotComponent implements OnInit {
    @Input() screenshot: Screenshots.Screenshot;

    @Output() back = new EventEmitter();

    constructor(public projectService: ProjectService) {}

    ngOnInit() {}

    getScreenshotClass() {
        return getScreenshotClass(this.screenshot.status);
    }

    onBackClick() {
        this.back.emit();
    }

    onCheckboxChange() {
        this.projectService._selected.next(this.projectService.selected);
    }

    onHeaderClick() {
        if (this.status_truth_does_not_exist && this.status_do_not_match) {
            this.projectService.setSelectedScreenshot(
                this.screenshot.key,
                !this.projectService.selected[this.screenshot.key],
            );
        }
    }

    get status_match() {
        return this.screenshot.status === Screenshots.Status.match;
    }

    get status_truth_does_not_exist() {
        return this.screenshot.status === Screenshots.Status.truth_does_not_exist;
    }

    get status_do_not_match() {
        return this.screenshot.status === Screenshots.Status.do_not_match;
    }

    get status_truth_was_not_tested() {
        return this.screenshot.status === Screenshots.Status.truth_was_not_tested;
    }
}
