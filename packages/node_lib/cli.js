#! /usr/bin/env node
'use strict';

const meow = require('meow');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const app = require('./app');
const os = require('os');

const helpText = `
	Usage
	  $ feebas

	Options
	  --config              Specify path to configuration file
`;

const cli = meow(helpText, {
    booleanDefault: undefined,
    flags: {
        config: {
            type: 'string',
            default: undefined,
            alias: 'c',
        },
    },
});

const cwd = process.cwd();

let configFilePath = cli.flags.c || cli.flags.config;
if (!configFilePath) {
    configFilePath = path.join(cwd, 'feebas.config.json');
} else if (!path.isAbsolute(configFilePath)) {
    configFilePath = path.join(cwd, configFilePath);
}

if (!fs.existsSync(configFilePath)) {
    console.error(`[ERROR] Configuration file ${configFilePath} does not exist!`);
    process.exit(1);
}

const platform = os.platform();
const appFilePath = path.join(__dirname, './app/', app.fileName[platform]);

const subProcess = spawn(path.join(__dirname, 'scripts/run', `${platform}.sh`), [configFilePath, appFilePath], {
    detached: true,
    cwd: process.cwd(),
    env: process.env,
});
subProcess.unref();
