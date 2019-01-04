import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
    MatButtonModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogConfig,
    MatDialogModule,
    MatRadioModule,
    MatTreeModule,
    MatIconModule,
    MatCheckboxModule,
    MatTabsModule,
} from '@angular/material';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const modules = [
    BrowserAnimationsModule,
    MatButtonModule,
    MatToolbarModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule,
    MatRadioModule,
    MatTreeModule,
    MatIconModule,
    MatCheckboxModule,
    MatTabsModule,
];

@NgModule({
    imports: [CommonModule, ...modules],
    providers: [MatDialogConfig],
    exports: [...modules],
})
export class MaterialModule {}
