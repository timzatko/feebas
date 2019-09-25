# development

- run `npm install && lerna bootstrap` [what is lerna?](https://github.com/lerna/lerna)

## app development
- run `npm start` and define path to configuration file in env variable `FEEBAS_DEV_CONFIG` or run `npm run app:start:fs-local` with predefined config

## node library development
- run `npm run lib:dev` to build app into

# releasing new versions

When updating the app update `desktop_app-version` in packages/node_lib/package.json.

### app releasing

- run `npm run app:release`

### node library publishing

- run `npm run lib:publish`

# logging

Runtime logs are logged via [electron-log](https://www.npmjs.com/package/electron-log).
