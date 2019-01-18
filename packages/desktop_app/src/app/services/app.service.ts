import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { App } from '../models/app';

import * as minimist from 'minimist';
import * as fs from 'fs-extra';
import * as path from 'path';
import getTempDir from '../scripts/get-temp-dir';

@Injectable()
export class AppService {
    env: App.Env = {};
    config: App.Config;
    configStatus: App.ConfigStatus;
    argv: { [key: string]: string };

    get isConfigFileOk() {
        return this.configStatus === App.ConfigStatus.OK;
    }

    get projects() {
        return this.config.projects;
    }

    constructor(public electronService: ElectronService) {
        this.env.variables = this.electronService.remote.process.env;
        this.argv = this.getArgv();
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

    // when opening feebas via URL, cli.js from library is not called so the configuration file is not passed in the arguments
    // save the arguments into the temp file
    private getArgv() {
        const argv = minimist(this.electronService.remote.process.argv);
        const tempFile = path.join(getTempDir(), 'last-args.json');

        if (!argv['config']) {
            if (fs.existsSync(tempFile)) {
                return JSON.parse(fs.readFileSync(tempFile, { encoding: 'utf8' }));
            }
            return argv;
        }

        fs.writeFileSync(tempFile, JSON.stringify(argv));
        return argv;
    }
}
