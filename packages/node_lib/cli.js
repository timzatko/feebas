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
	  --debug               Show debug logs
`;

const cli = meow(helpText, {
    booleanDefault: undefined,
    flags: {
        config: {
            type: 'string',
            default: undefined,
            alias: 'c',
        },
        debug: {
            type: 'boolean',
            alias: 'd',
        },
    },
});

function log(message) {
    if (cli.flags.debug || cli.flags.d) {
        console.log(message);
    }
}

log('starting...');

// check if feebas app is installed, if not, install it
if (!fs.existsSync(appPath)) {
    log('installing feebas...');
    require(path.join(__dirname, 'scripts/install.js'));
}

// set configuration file from arguments
// if arguments are not present look for feebas.config.json in current working directory
let configPath = cli.flags.c || cli.flags.config;
if (!configPath) {
    configPath = path.join(cwd, 'feebas.config.json');
    log(`setting config path from current working directory (${configPath})`);
} else if (!path.isAbsolute(configPath)) {
    configPath = path.join(cwd, configPath);
    log(`setting config path from current working directory and cli options (${configPath})`);
} else {
    log(`setting config path cli options (${configPath})`);
}

if (!fs.existsSync(configPath)) {
    console.error(`[ERROR] Configuration file ${configPath} does not exist!`);
    process.exit(1);
}

// run feebas app
const subProcess = spawn(
    path.join(__dirname, 'scripts/run', `${app.platform[platform].scriptName}`),
    [configPath, appPath],
    {
        detached: true,
        cwd: process.cwd(),
        env: process.env,
    },
);

subProcess.stdout.on('data', data => {
    log(`feebas run sub process stdout: ${data}`);
});

subProcess.stderr.on('data', data => {
    log(`feebas run sub process stderr: ${data}`);
});

subProcess.on('close', code => {
    log(`feebas run sub process exited with code ${code}`);
});

subProcess.unref();
