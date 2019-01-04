import 'reflect-metadata';
import '../polyfills';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';

import { ElectronService } from './services/electron.service';

import { WebviewDirective } from './directives/webview.directive';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { AppService } from './services/app.service';
import { ProjectService } from './services/project.service';
import { MaterialModule } from './material/material.module';
import { ProjectComponent } from './components/project/project.component';
import { LoaderService } from './services/loader.service';
import { LoaderComponent } from './components/loader/loader.component';
import { ConfigStatusComponent } from './components/config-status/config-status.component';
import { TreeComponent } from './components/tree/tree.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ScreenshotComponent } from './components/screenshot/screenshot.component';
import { ScreenshotItemComponent } from './components/screenshot-item/screenshot-item.component';
import { FilterDialogComponent } from './components/filter-dialog/filter-dialog.component';

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        WebviewDirective,
        ProjectComponent,
        LoaderComponent,
        ConfigStatusComponent,
        TreeComponent,
        ScreenshotComponent,
        ScreenshotItemComponent,
        FilterDialogComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        AppRoutingModule,
        MaterialModule,
        BrowserAnimationsModule,
    ],
    providers: [ElectronService, AppService, ProjectService, LoaderService],
    entryComponents: [FilterDialogComponent],
    bootstrap: [AppComponent],
})
export class AppModule {}
