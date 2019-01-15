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
    argv: {[key: string]: string};

    get isConfigFileOk() {
        return this.configStatus === App.ConfigStatus.OK;
    }

    get projects() {
        return this.config.projects;
    }

    constructor(public electronService: ElectronService) {
        this.env.variables = this.electronService.remote.process.env;
        this.argv = minimist(this.electronService.remote.process.argv);
        this.configStatus = this.loadConfig();
    }

    private loadConfig() {
        const configFile = this.argv['config'];
        if (!configFile) {
            return App.ConfigStatus.CONFIG_FILE_NOT_DEFINED;
        }
        this.env.configPath = configFile;
        const cwd = this.electronService.remote.process.cwd();

        if (!fs.existsSync(configFile)) {
            console.error(cwd);
            console.error(configFile);
            return App.ConfigStatus.CONFIG_FILE_NOT_EXISTS;
        }

        const data = fs.readFileSync(configFile, { encoding: 'utf-8' });
        const config = JSON.parse(data);

        if (config === undefined) {
            return App.ConfigStatus.INCORRECT_JSON;
        }

        this.config = config;
        this.env.cwd = path.dirname(configFile); // set current working directory to config file location
        return App.ConfigStatus.OK;
    }
}
