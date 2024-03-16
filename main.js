const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const socketio = require("socket.io");
const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");

const PORT = process.env.PORT || 5000;
const isMac = process.platform === "darwin";
let hostName = "";

var corsOptions = {
  cors: true,
  origins: "*",
};

const appExp = express();
const server = http.createServer(appExp);

appExp.get("/", (req, res) => {
  res.send(hostName);
});

// Socket Logic
const io = socketio(server, corsOptions);

let players = [];

io.on("connection", (socket) => {
  console.log("socket");
  const playerCode = socket.id.substring(socket.id.length - 5);
  players.push({ code: playerCode, paired: false });
  socket.join(playerCode);
  socket.emit("init", { msg: "Connected", id: socket.id });
  socket.on("moved", ({ move, playerId, code }) => {
    socket.broadcast.to(code).emit("responded", { move, playerId });
  });
  socket.on("code", (data) => {
    let ind = players.findIndex((player) => player.code === data.code);
    if (ind === -1) {
      socket.emit("begin", {
        status: "error",
        msg: "No game for the given code is present",
      });
      return;
    }
    if (players[ind].paired) {
      socket.emit("begin", {
        status: "error",
        msg: "The person is playing with someone else",
      });
      return;
    }
    let currInd = players.findIndex((player) => player.code === playerCode);
    players[ind].paired = true;
    players[currInd].paired = true;
    socket.join(data.code);
    socket.emit("begin", { status: "success", code: data.code });
    socket.broadcast
      .to(data.code)
      .emit("begin", { status: "success", code: data.code });
  });
  socket.on("gameEnded", ({ code }) => {
    if (playerCode !== code) {
      socket.leave(code);
    }
    let ind = players.findIndex((player) => player.code === playerCode);
    players[ind].paired = false;
  });
  socket.on("disconnect", () => {
    players = players.filter((player) => player.code !== playerCode);
  });
});

appExp.use(cors());

server.listen(PORT, () => console.log(`The server is running on ${PORT}`));

// creating main window
function createMainWindow() {
  const mainWindow = new BrowserWindow({
    title: "Shoot-IO",
    width: 1000,
    height: 1200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.webContents.openDevTools();

  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
}

// creating about window
function createAboutWindow() {
  const aboutWindow = new BrowserWindow({
    title: "About Shoot-IO",
    width: 500,
    height: 600,
  });

  aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
}

// app is ready
app.whenReady().then(() => {
  createMainWindow();

  // Implement menu
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Menu template
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: "About",
            },
          ],
        },
      ]
    : []),
  {
    role: "fileMenu",
  },
  ...(!isMac
    ? [
        {
          label: "Help",
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
];

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

ipcMain.on("hostName", (e, data) => {
  console.log(data.name);
  hostName = data.name;
});
