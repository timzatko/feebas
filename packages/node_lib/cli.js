#! /usr/bin/env node
'use strict';

const meow = require('meow');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const app = require('./app');
const os = require('os');
const install = require('./scripts/install.js');

const cwd = process.cwd();
const platform = os.platform();
const appPath = path.join(__dirname, './app/', app.platform[platform].appName);

const helpText = `
	Usage
	  $ feebas

	Options
	  --config              Specify path to configuration file
	  --debug               Show logs and open dev tools
`;

const cli = meow(helpText, {
    booleanDefault: false,
    flags: {
        config: {
            type: 'string',
            alias: 'c',
        },
        project: {
            type: 'string',
            alias: 'p',
        },
        debug: {
            type: 'boolean',
            alias: 'd',
        },
    },
});

const debugEnabled = cli.flags.debug || cli.flags.d || 0;

function log(message) {
    if (debugEnabled) {
        console.log(`[FEEBAS] ${message}`);
    }
}

(async () => {
    log('starting...');

    // check if feebas app is installed, if not, install it
    if (!fs.existsSync(appPath)) {
        log('installing feebas...');

        await install();
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
        process.exit(3);
    }

    // open project from arguments
    const defaultProject = cli.flags.p || cli.flags.project || '';
    const appFilePath = path.join(__dirname, 'scripts/run', `${app.platform[platform].scriptName}`);

    if (!fs.existsSync(appFilePath)) {
        console.error(`[ERROR] Could not find feebas binary in ${appFilePath}!`);
        process.exit(4);
    }

    // run feebas app
    const subProcess = spawn(appFilePath, [configPath, appPath, Number(debugEnabled), defaultProject], {
        detached: true,
        cwd: process.cwd(),
        env: process.env,
    });

    subProcess.stdout.on('data', data => {
        log(`launcher process stdout: ${data}`);
    });

    subProcess.stderr.on('data', data => {
        log(`launcher process stderr: ${data}`);
    });

    subProcess.on('close', code => {
        log(`launcher process exited with code ${code}`);
    });

    subProcess.unref();
})();
