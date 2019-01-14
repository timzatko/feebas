#! /bin/sh
npm run build:prod
npx electron-builder --mac --linux --win --publish always
