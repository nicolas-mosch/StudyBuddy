// Requires
const {
    app,
    BrowserWindow,
    Menu,
    MenuItem,
    dialog,
    ipcMain
} = require('electron');
const configuration = require('./controllers/configuration.js');
const fs = require('fs');
// Windows
var mainWindow = null;
var updater = require('./controllers/updater');



var template = [{
        label: 'File',
        submenu: [{
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
    },
    {
        label: 'Projects',
        submenu: [{
                label: 'New Project',
                accelerator: 'CmdOrCtrl+p',
                click: function(item, focusedWindow) {
                    mainWindow.webContents.on('did-finish-load', function() {
                        mainWindow.webContents.send('new-project');
                    });
                    mainWindow.loadURL('file://' + __dirname + '/views/layouts/project.html');
                }
            },
            {
                label: 'Open Project',
                accelerator: 'CmdOrCtrl+o',
                click: function(item, focusedWindow) {
                    var path = dialog.showOpenDialog({
                        title: 'Open Q&A Set',
                        defaultPath: '.',
                        filters: [{
                            name: 'StudyAssistron Project',
                            extensions: ['sap']
                        }],
                        properties: ['openFile']
                    });

                    if(!path){
                      return;
                    }

                    var fileContents = fs.readFileSync(path[0], "utf-8");
                    var fileName = path[0].split('\\');
                    fileName = fileName[fileName.length - 1];

                    mainWindow.webContents.on('did-finish-load', function() {
                        mainWindow.webContents.send('load-project', JSON.parse(fileContents), fileName);
                    });

                    mainWindow.loadURL('file://' + __dirname + '/views/layouts/project.html');

                }
            }
        ]
    },
    {
        label: 'Quiz',
        submenu: [{
                label: 'New Quiz',
                accelerator: 'CmdOrCtrl+q',
                click: function(item, focusedWindow) {
                  var paths = dialog.showOpenDialog({
                      title: 'New Quiz of Project(s)',
                      defaultPath: '.',
                      filters: [{
                          name: 'StudyAssistron Project',
                          extensions: ['sap']
                      }],
                      properties: ['openFile', 'multiSelections']
                  });

                  if(!paths || !paths.length){
                    return;
                  }

                  var allQuestions = [];
                  for(var i = 0; i < paths.length; i++){
                    allQuestions = allQuestions.concat(JSON.parse(fs.readFileSync(paths[i], "utf-8")));
                  }



                  mainWindow.webContents.on('did-finish-load', function() {
                      mainWindow.webContents.send('new-quiz', allQuestions);
                  });
                  mainWindow.loadURL('file://' + __dirname + '/views/layouts/quiz.html');
                }
            },
            {
                label: 'Load Quiz',
                accelerator: 'CmdOrCtrl+l',
                click: function(item, focusedWindow) {
                  var path = dialog.showOpenDialog({
                      title: 'Load Quiz',
                      defaultPath: '.',
                      filters: [{
                          name: 'StudyAssistron Quiz',
                          extensions: ['saq']
                      }],
                      properties: ['openFile']
                  });

                  if(!path){
                    return;
                  }

                  var fileContents = fs.readFileSync(path[0], "utf-8");
                  var fileName = path[0].split('\\');
                  fileName = fileName[fileName.length - 1];

                  mainWindow.webContents.on('did-finish-load', function() {
                      mainWindow.webContents.send('load-quiz', JSON.parse(fileContents), fileName);
                  });

                  mainWindow.loadURL('file://' + __dirname + '/views/layouts/quiz.html');
                }
            }
        ]
    },
    {
        label: 'Settings',
        submenu: [
          {
              label: 'Check for updates',
              click: updater.checkForUpdates
          }
        ]
    }
];

ipcMain.on('new-project', function() {
    mainWindow.loadURL('file://' + __dirname + '/views/layouts/project.html');
});

ipcMain.on('save-quiz', function(message, quiz) {
  //  TODO: save button should save to open quiz directly if one is open

    var path = dialog.showSaveDialog({
        title: 'Save Quiz'
    });

    if(!path){
      return;
    }

    if (!path.endsWith('.saq')) {
        path += '.saq';
    }

    fs.writeFile(path, JSON.stringify(quiz), function(inError) {
        if (inError) {
            console.error(inError);
            return;
        }
        // TODO: Add notifications to frontend
        console.log('Quiz Saved');
    });
});

ipcMain.on('save-project', function(message, project) {
  //  TODO: save button should save to open project directly if one is open

    var path = dialog.showSaveDialog({
        title: 'Save Project'
    });

    if(!path){
      return;
    }

    if (!path.endsWith('.sap')) {
        path += '.sap';
    }

    fs.writeFile(path, JSON.stringify(project), function(inError) {
        if (inError) {
            console.error(inError);
            return;
        }
        // TODO: Add notifications to frontend
        console.log('Project Saved');
    });
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
    mainWindow.on('close', function(e) {
      var choice = dialog.showMessageBox(this,
        {
          type: 'question',
          buttons: ['Yes', 'No'],
          title: 'Confirm',
          message: 'You might have unsaved changes in your project or quiz.\nAre you sure you want to exit StudyAssistron?'
       });
       if(choice == 1){
         e.preventDefault();
       }
    });

    mainWindow.on('closed', function() {
      legendWindow = null;
      mainWindow = null;
    });
});
