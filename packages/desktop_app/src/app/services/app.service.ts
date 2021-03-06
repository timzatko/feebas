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
        const cwd = this.electronService.remote.process.cwd();
        const argvConfigFile = this.argv['config'];
        const configFile = path.isAbsolute(argvConfigFile) ? argvConfigFile : path.join(cwd, argvConfigFile);
        if (!configFile) {
            return App.ConfigStatus.CONFIG_FILE_NOT_DEFINED;
        }

        this.env.configPath = configFile;

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

        // set default project if is provided from command line
        const defaultProject = this.argv['project'];
        if (typeof defaultProject === 'string' && defaultProject.length > 0) {
            this.env.defaultProject = defaultProject;
        }

        return App.ConfigStatus.OK;
    }

    // when opening feebas via URL, cli.js from library is not called so the configuration file is not passed in the arguments
    // save the arguments into the temp file
    private getArgv(): minimist.ParsedArgs {
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
