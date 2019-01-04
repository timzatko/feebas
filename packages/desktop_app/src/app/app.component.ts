import { Component, OnInit } from '@angular/core';
import { ElectronService } from './services/electron.service';
import { AppService } from './services/app.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    constructor(public electronService: ElectronService, public appService: AppService, public router: Router) {
        console.log('Electron ipcRenderer', electronService.ipcRenderer);
        console.log('NodeJS childProcess', electronService.childProcess);
    }

    ngOnInit() {
        if (!this.appService.isConfigFileOk) {
            return this.router.navigate(['/config-status']);
        }
    }
}
