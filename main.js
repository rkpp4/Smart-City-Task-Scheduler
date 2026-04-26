const { app, BrowserWindow } = require('electron');
const { startServer } = require('./server');

let mainWindow;

app.on('ready', async () => {
    // Start the local Express & in-memory Mongo server
    await startServer();

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Load the local dashboard
    mainWindow.loadURL('http://localhost:3000');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
