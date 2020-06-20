import { app, BrowserWindow, screen } from 'electron';

import * as path from 'path';
import * as url from 'url';
import * as minimist from 'minimist';

let win: BrowserWindow;

const args = minimist(process.argv);

const createWindow = () => {
    if (win) {
        return win;
    }

    const size = screen.getPrimaryDisplay().workAreaSize;

    // Create the browser window.
    win = new BrowserWindow({
        x: 0,
        y: 0,
        width: 1000 || size.width,
        height: 600 || size.height,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    if (args.serve) {
        require('electron-reload')(__dirname, {
            electron: require(`${__dirname}/node_modules/electron`),
        });
        win.loadURL('http://localhost:4200');
    } else {
        win.loadURL(
            url.format({
                pathname: path.join(__dirname, 'dist/index.html'),
                protocol: 'file:',
                slashes: true,
            }),
        );
    }

    if (args.serve || args.debug) {
        win.webContents.openDevTools();
    }

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store window
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });

    return win;
};

try {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on('ready', createWindow);

    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
        app.quit();
    });

    app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        createWindow();
    });

    // Define custom protocol handler. Deep linking works on packaged versions of the application!
    app.setAsDefaultProtocolClient('feebas');

    app.on('open-url', (event, fullUrl) => {
        event.preventDefault();
        createWindow().webContents.send('open-url', fullUrl);
    });
} catch (e) {
    // Catch Error
    // throw e;
}
