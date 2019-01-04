#! /bin/sh
npm run build:prod
npx electron-builder --mac --publish always
