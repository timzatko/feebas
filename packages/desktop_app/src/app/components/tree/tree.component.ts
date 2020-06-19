import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import { Screenshots } from '../../models/screenshots';
import { NestedTreeControl } from '@angular/cdk/tree';
import { ProjectService } from '../../services/project.service';
import * as path from 'path';
import { FilterDialogComponent } from '../filter-dialog/filter-dialog.component';
import { Subscription } from 'rxjs';
import { getScreenshotClass } from '../../scripts/screenshot';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { MatDialog } from '@angular/material/dialog';

export type TreeLeaf = Screenshots.Screenshot;

export interface TreeNode {
    children: Tree;
    key: string;
    status: Screenshots.Status;
}

export type TreeItem = TreeLeaf | TreeNode;
export type Tree = TreeItem[];

@Component({
    selector: 'app-tree',
    templateUrl: './tree.component.html',
    styleUrls: ['./tree.component.scss'],
})
export class TreeComponent implements OnInit, OnDestroy, OnChanges {
    nestedTreeControl: NestedTreeControl<TreeItem>;
    nestedDataSource: MatTreeNestedDataSource<TreeItem>;
    isExpanded = false;

    @ViewChildren('treeNode') screenshots: QueryList<ElementRef>;

    @Input()
    currentScreenshot: Screenshots.Screenshot;

    @Output()
    screenshotOpen = new EventEmitter<Screenshots.Screenshot>();

    subscriptions: Subscription[] = [];
    sections: { [key: string]: boolean } = {};
    bulkSelected = false;

    @HostListener('document:keyup', ['$event'])
    onKeyUp(event: KeyboardEvent) {
        // Ctrl + E should collapse / expand the tree
        if (event.code === 'KeyE' && event.ctrlKey) {
            this.onExpandClick();
        } else if (event.code === 'KeyF' && event.ctrlKey) {
            // Ctrl + F should open the screenshot filter
            this.onFilterClick();
        }
    }

    constructor(public projectService: ProjectService, public filterDialog: MatDialog) {
        this.nestedTreeControl = new NestedTreeControl<TreeItem>(this._getChildren);
        this.nestedDataSource = new MatTreeNestedDataSource();
    }

    private setTree() {
        const tree = this.setNodeStates(this.buildTree());

        this.nestedDataSource.data = tree;
        this.nestedTreeControl.dataNodes = tree;

        this.expandOrCollapse();
    }

    private buildTree() {
        const screenshots = this.projectService.filteredScreenshots;

        const treeInsert = (tree: Tree, item: TreeItem, level = 0) => {
            if (level + 1 < item.key.split(path.sep).length) {
                const subKey = item.key
                    .split(path.sep)
                    .slice(0, level + 1)
                    .join(path.sep);
                const parent = tree.find(_item => _item.key === subKey);
                const treeNode = parent as TreeNode;
                if (!this.sections.hasOwnProperty(treeNode.key)) {
                    this.sections[treeNode.key] = false;
                }
                treeInsert(treeNode.children, item, level + 1);
            } else {
                if (!tree.find(({ key }) => key === item.key)) {
                    tree.push(item);
                }
            }
        };

        return screenshots.reduce((tree, screenshot) => {
            const pathArray = screenshot.key.split(path.sep);

            pathArray.forEach((value, index) => {
                if (pathArray.length === index + 1) {
                    treeInsert(tree, screenshot);
                } else {
                    treeInsert(tree, {
                        key: pathArray.slice(0, index + 1).join(path.sep),
                        status: Screenshots.Status.match,
                        children: [],
                    });
                }
            });

            return tree;
        }, []);
    }

    private setNodeStates(tree: Tree) {
        const setNodeState = (treeItem: TreeItem) => {
            const treeNode = treeItem as TreeNode;
            if (!!treeNode.children) {
                treeNode.children = treeNode.children.map(setNodeState);
                treeNode.status = treeNode.children.reduce(
                    (status: Screenshots.Status, _treeItem: TreeItem) => Math.max(status, _treeItem.status),
                    Screenshots.Status.match,
                );
            }
            return treeItem;
        };
        return tree.map(setNodeState);
    }

    private expandOrCollapse() {
        if (!this.isExpanded) {
            this.nestedTreeControl.expandAll();
        } else {
            this.nestedTreeControl.collapseAll();
        }
    }

    get form() {
        return this.projectService.filter;
    }

    ngOnInit() {
        this.subscriptions.push(
            this.projectService.filterChange.subscribe(() => {
                this.setTree();
                // unselect screenshots which are hidden by active filters
                this.projectService._selected.next(
                    this.projectService.filteredScreenshots.reduce<Record<string, boolean>>((obj, { key }) => {
                        obj[key] = this.projectService.selected[key];
                        return obj;
                    }, {}),
                );
            }),
        );
        this.subscriptions.push(this.projectService._screenshots.asObservable().subscribe(() => this.setTree()));
        this.subscriptions.push(
            this.projectService._selected.asObservable().subscribe(selected => this.updateCheckboxes(selected)),
        );
    }

    ngOnChanges(changes: SimpleChanges): void {
        const currentScreenshot = changes.currentScreenshot.currentValue;

        if (currentScreenshot && this.screenshots) {
            const screenshot = this.screenshots.find(
                item => item.nativeElement.getAttribute('data-key') === currentScreenshot.key,
            );
            if (screenshot) {
                screenshot.nativeElement.scrollIntoView({ block: 'center', inline: 'start' });
            }
        }
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    onExpandClick() {
        this.isExpanded = !this.isExpanded;
        this.expandOrCollapse();
    }

    onFilterClick() {
        this.filterDialog.open(FilterDialogComponent, {
            width: '300px',
            data: this.form,
        });
    }

    getItemClass(item: TreeItem) {
        return getScreenshotClass(item.status);
    }

    onShowScreenshot(screenshot: Screenshots.Screenshot) {
        this.screenshotOpen.emit(screenshot);
    }

    getItemName(item: TreeItem) {
        return item.key.split(path.sep).slice(-1);
    }

    hasNestedChild(_: number, item: TreeItem) {
        return !!(item as TreeNode).children;
    }

    isCheckboxVisible(screenshot: Screenshots.Screenshot) {
        return screenshot.status === Screenshots.Status.do_not_match || screenshot.status === Screenshots.Status.truth_does_not_exist;
    }

    isBulkTreeCheckboxVisible() {
        return this.projectService.filteredScreenshots.some(this.isCheckboxVisible);
    }

    updateCheckboxes(selected: { [key: string]: boolean }) {
        Object.keys(this.sections).forEach(sectionKey => {
            const isSectionSelected = Object.keys(selected)
                .filter(screenshotKey => screenshotKey.startsWith(sectionKey + path.sep))
                .some(screenshotKey => selected[screenshotKey]);
            this.sections[sectionKey] = isSectionSelected;
        });
    }

    onCheckboxChange() {
        this.projectService._selected.next(this.projectService.selected);
    }

    onBulkSelect(value: boolean) {
        this.projectService.selected = this.projectService.filteredScreenshots
            .map(({ key }) => key)
            .reduce<Record<string, boolean>>((obj, key) => {
                obj[key] = value;
                return obj;
            }, {});
    }

    onSectionSelect(selected: boolean, node: TreeNode) {
        const screenshots = this.projectService.filteredScreenshots.filter(({ key }) =>
            key.startsWith(node.key + path.sep),
        );
        this.projectService.selected = screenshots
            .map(({ key }) => key)
            .reduce<Record<string, boolean>>((obj, key) => {
                obj[key] = selected;
                return obj;
            }, {});
    }

    isHighlighted(screenshot: Screenshots.Screenshot) {
        return this.currentScreenshot && screenshot.key === this.currentScreenshot.key;
    }

    private _getChildren(item: TreeNode) {
        return item.children;
    }
}
