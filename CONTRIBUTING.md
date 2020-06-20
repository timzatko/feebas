# CONTRIBUTING

## Prerequisites

-   Node (v12.6.x)

## Setup

Install dependencies by running `npm install && lerna bootstrap` [what is lerna?](https://github.com/lerna/lerna)

## Development

### App development

-   run `npm start` and define the path to configuration file in env variable `FEEBAS_DEV_CONFIG` or run `npm run app:start:fs-local` with predefined config. It uses the config from `./packages/desktop_app/integrations/fs-local`.

## NPM Package Development

-   run `npm run lib:dev`

## Releasing a new versions

1.  run `npm version major.minor.patch` to bump the version (this will bump the version for both, the desktop app and the node library)
1.  run `npm tag major.minor.patch` to create a tag
1.  run `git push --tags` to push the created tag
1.  run `npm run app:release` to release the app, it will create a draft release on GitHub
1.  via GitHub interface publish the drafted release
1.  run `npm run lib:publish` to piblish the npm package

## Debugging

Runtime logs are logged via [electron-log](https://www.npmjs.com/package/electron-log).
