const { app, BrowserWindow, Menu} = require('electron');
const express = require("express");
const http = require("http");
const path = require('path');

const PORT = process.env.PORT || 5000;
const isMac = process.platform === 'darwin';

const appExp = express();
const server = http.createServer(appExp);

appExp.get('/',(req,res)=>{
    res.send("Hi");
})

server.listen(PORT, () => console.log(`The server is running on ${PORT}`));

// creating main window
function createMainWindow () {
    const mainWindow = new BrowserWindow({
        title: 'Shoot-IO',
        width:1000,
        height: 1200,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.webContents.openDevTools();

    mainWindow.loadFile(path.join(__dirname,'./renderer/index.html'));
}

// creating about window
function createAboutWindow () {
    const aboutWindow = new BrowserWindow({
        title: 'About Shoot-IO',
        width: 500,
        height: 600
    });

    aboutWindow.loadFile(path.join(__dirname,'./renderer/about.html'));
}

// app is ready
app.whenReady().then(()=>{
    createMainWindow();

    // Implement menu
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    app.on('activate',()=>{
        if (BrowserWindow.getAllWindows().length === 0){
            createMainWindow();
        }
    })
});

// Menu template
const menu = [
    ...(isMac ? [{
        label: app.name,
        submenu: [
            {
                label: 'About'
            }
        ]
    }] : []),
    {
        role:'fileMenu',
    },
    ...(!isMac ? [{
        label: 'Help',
        submenu:[
            {
                label: 'About',
                click: createAboutWindow
            }
        ]
    }]: [])
];

app.on('window-all-closed',()=>{
    if(!isMac){
        app.quit();
    }
});