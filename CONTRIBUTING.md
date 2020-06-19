# CONTRIBUTING

## Prerequisites

- Node ()

## Setup

Install dependencies by running `npm install && lerna bootstrap` [what is lerna?](https://github.com/lerna/lerna)

## Development

### App development

- run `npm start` and define the path to configuration file in env variable `FEEBAS_DEV_CONFIG` or run `npm run app:start:fs-local` with predefined config. It uses the config from `./packages/desktop_app/integrations/fs-local`. 

## NPM Package Development

- run `npm run lib:dev`

## Releasing a new versions

When updating the app update `desktop_app-version` in packages/node_lib/package.json.

### App releasing

This will release a new binary of the desktop app to the GitHub.

- run `npm run app:release`

### NPM Package Publishing

This will publish package to the npm registry.

- run `npm run lib:publish`

## Debugging

Runtime logs are logged via [electron-log](https://www.npmjs.com/package/electron-log).
