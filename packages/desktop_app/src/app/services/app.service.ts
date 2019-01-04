import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { App } from '../models/app';

import * as minimist from 'minimist';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class AppService {
    env: App.Env = {};
    config: App.Config;
    configStatus: App.ConfigStatus;

    get isConfigFileOk() {
        return this.configStatus === App.ConfigStatus.OK;
    }

    get projects() {
        return this.config.projects;
    }

    constructor(public electronService: ElectronService) {
        this.env.variables = this.electronService.remote.process.env;

        this.configStatus = this.loadConfig();
    }

    private loadConfig() {
        const configFile = this.env.variables.FEEBAS_CONFIG;
        if (!configFile) {
            return App.ConfigStatus.CONFIG_FILE_NOT_DEFINED;
        }

        const cwd = this.electronService.remote.process.cwd();
        const configFilePath = path.join(cwd, configFile);

        if (!fs.existsSync(configFilePath)) {
            console.error(cwd);
            console.error(configFile);
            return App.ConfigStatus.CONFIG_FILE_NOT_EXISTS;
        }

        const data = fs.readFileSync(configFilePath, { encoding: 'utf-8' });
        const config = JSON.parse(data);

        if (config === undefined) {
            return App.ConfigStatus.INCORRECT_JSON;
        }

        this.config = config;
        this.env.cwd = path.dirname(configFilePath); // set current working directory to config file location
        return App.ConfigStatus.OK;
    }
}
