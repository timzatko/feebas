import { Component, OnInit } from '@angular/core';
import { App } from '../../models/app';
import { AppService } from '../../services/app.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-config-status',
    templateUrl: './config-status.component.html',
    styleUrls: ['./config-status.component.scss'],
})
export class ConfigStatusComponent implements OnInit {
    configStatusValues = App.ConfigStatus;

    constructor(public appService: AppService, public router: Router) {}

    ngOnInit() {
        if (this.appService.isConfigFileOk) {
            return this.router.navigate(['/']);
        }
    }
}
