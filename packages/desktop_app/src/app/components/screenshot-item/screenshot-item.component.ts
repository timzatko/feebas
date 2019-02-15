import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Screenshots } from '../../models/screenshots';
import { ProjectService } from '../../services/project.service';
import { getScreenshotClass } from '../../scripts/screenshot';

@Component({
    selector: 'app-screenshot-item',
    templateUrl: './screenshot-item.component.html',
    styleUrls: ['./screenshot-item.component.scss'],
})
export class ScreenshotItemComponent implements OnInit {
    @Input() screenshot: Screenshots.Screenshot;
    @Input() highlight = false;

    @Output() open = new EventEmitter<Screenshots.Screenshot>();

    constructor(public projectService: ProjectService) {}

    ngOnInit() {
    }

    get gitStatusTitle() {
        return this.screenshot.gitStatus + ' (git)';
    }

    get gitStatusKey() {
      return this.screenshot.gitStatus.toString().toUpperCase().charAt(0);
    }

    get image() {
        const screenshot = this.screenshot.path.diff || this.screenshot.path.truth || this.screenshot.path.current;
        return this.projectService.getLocalImageBase64(screenshot);
    }

    getClass() {
        return { ...getScreenshotClass(this.screenshot.status), caption: true };
    }

    onLabelClick() {
        this.projectService._selected.value[this.screenshot.key] = !this.projectService._selected.value[this.screenshot.key];
        this.onCheckboxChange();
    }

    onScreenshotClick() {
        this.open.emit(this.screenshot);
    }

    onCheckboxChange() {
        this.projectService._selected.next(this.projectService.selected);
    }

    get isCheckboxVisible() {
        return this.screenshot.status !== Screenshots.Status.match;
    }
}
