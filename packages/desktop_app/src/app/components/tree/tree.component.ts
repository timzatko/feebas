import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { Screenshots } from '../../models/screenshots';
import { MatDialog, MatTreeNestedDataSource } from '@angular/material';
import { NestedTreeControl } from '@angular/cdk/tree';
import { ProjectService } from '../../services/project.service';
import * as path from 'path';
import { FilterDialogComponent } from '../filter-dialog/filter-dialog.component';
import { Subscription } from 'rxjs';

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
export class TreeComponent implements OnInit, OnDestroy {
    nestedTreeControl: NestedTreeControl<TreeItem>;
    nestedDataSource: MatTreeNestedDataSource<TreeItem>;
    isExpanded = false;

    @Output()
    screenshotOpen = new EventEmitter<Screenshots.Screenshot>();

    subscriptions: Subscription[] = [];
    sections: { [key: string]: boolean } = {};

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

        const treeInsert = (tree: Tree, item: TreeItem, level: number) => {
            const subKey = item.key
                .split(path.sep)
                .slice(0, level + 1)
                .join(path.sep);

            const parent = tree.find(_item => _item.key === subKey);

            if (parent) {
                const treeNode = parent as TreeNode;
                if (!this.sections.hasOwnProperty(treeNode.key)) {
                    this.sections[treeNode.key] = false;
                }
                treeInsert(treeNode.children, item, level + 1);
            } else {
                tree.push(item);
            }
        };

        return screenshots.reduce((tree, screenshot) => {
            const pathArray = screenshot.key.split(path.sep);

            pathArray.forEach((value, index) => {
                const n = index + 1;

                if (pathArray.length === n) {
                    treeInsert(tree, screenshot, 0);
                } else {
                    treeInsert(
                        tree,
                        { key: pathArray.slice(0, n).join(path.sep), status: Screenshots.Status.match, children: [] },
                        0,
                    );
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
        this.subscriptions.push(this.projectService.filterChange.subscribe(() => this.setTree()));
        this.subscriptions.push(this.projectService._screenshots.asObservable().subscribe(() => this.setTree()));
        this.subscriptions.push(this.projectService._selected.asObservable().subscribe(v => this.setCheckboxes(v)));
        this.setTree();
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
        return {
            'mat-tree-node-success': item.status === Screenshots.Status.match,
            'mat-tree-node-warning':
                item.status === Screenshots.Status.truth_was_not_tested ||
                item.status === Screenshots.Status.truth_does_not_exist,
            'mat-tree-node-error': item.status === Screenshots.Status.do_not_match,
        };
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
        return screenshot.status !== Screenshots.Status.match;
    }

    setCheckboxes(selected: { [key: string]: boolean }) {
        Object.keys(this.sections).forEach(sectionKey => {
            const isSectionSelected = Object.keys(selected)
                .filter(screenshotKey => screenshotKey.startsWith(sectionKey))
                .some(screenshotKey => selected[screenshotKey]);
            this.sections[sectionKey] = isSectionSelected;
        });
    }

    onCheckboxChange() {
        this.projectService._selected.next(this.projectService.selected);
    }

    onSelectSection(selected: boolean, node: TreeNode) {
        const screenshots = this.projectService.screenshots.filter(({ key }) => key.startsWith(node.key));
        this.projectService.selected = screenshots
            .map(({ key }) => key)
            .reduce((obj, key) => {
                obj[key] = selected;
                return obj;
            }, {});
    }

    private _getChildren(item: TreeNode) {
        return item.children;
    }
}
