// Requires
const {
    app,
    BrowserWindow,
    Menu,
    MenuItem,
    dialog,
    ipcMain
} = require('electron');
const configuration = require('./configuration.js');

// Windows
var mainWindow = null;




var template = [{
    label: 'File',
    submenu: [{
            label: 'New Q&A Set',
            accelerator: 'CmdOrCtrl+n',
            click: function(item, focusedWindow) {
                mainWindow.loadURL('file://' + __dirname + '/views/layouts/project.html');
            }
        }, {
            label: 'Open DevTools',
            accelerator: 'F12',
            click: function(item, focusedWindow) {
                mainWindow.webContents.openDevTools();
            }
        },
        {
            label: 'Exit',
            accelerator: 'CmdOrCtrl+Esc',
            click: function(item, focusedWindow) {
                mainWindow.close();
            }
        }
    ]
}, {
    label: 'Preferences',
    submenu: []
}];

ipcMain.on('new-project', function() {
    mainWindow.loadURL('file://' + __dirname + '/views/layouts/project.html');
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    if (process.platform != 'darwin')
        app.quit();
});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600
    });

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/views/layouts/index.html');
    mainWindow.maximize();
    //mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        legendWindow = null;
        mainWindow = null;
    });
});
