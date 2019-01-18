#! /usr/bin/env node
'use strict';

const meow = require('meow');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const app = require('./app');
const os = require('os');
const cwd = process.cwd();
const platform = os.platform();
const appPath = path.join(__dirname, './app/', app.platform[platform].appName);

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

// check if feebas app is installed, if not, install it
if (!fs.existsSync(appPath)) {
    require(path.join(__dirname, 'scripts/install.js'));
}

// set configuration file from arguments
// if arguments are not present look for feebas.config.json in current working directory
let configPath = cli.flags.c || cli.flags.config;
if (!configPath) {
    configPath = path.join(cwd, 'feebas.config.json');
} else if (!path.isAbsolute(configPath)) {
    configPath = path.join(cwd, configPath);
}

if (!fs.existsSync(configPath)) {
    console.error(`[ERROR] Configuration file ${configPath} does not exist!`);
    process.exit(1);
}

// run feebas app
const subProcess = spawn(path.join(__dirname, 'scripts/run', `${app.platform[platform].scriptName}`), [configPath, appPath], {
    detached: true,
    cwd: process.cwd(),
    env: process.env,
});
subProcess.unref();
