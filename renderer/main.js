let hosts = [];

let socket;
var canvas = document.getElementById("canvas");
var head1 = document.getElementById("head1");
var head2 = document.getElementById("head2");
var ctx = canvas.getContext("2d");

var xr, yr, xg, yg, moveSound, shootSound;
let id, code;

// Connection Logic
function init() {
  address
    .getLocalNetworks()
    .then((devices) => {
      searchHosts(devices);
    })
    .catch((error) => {
      console.error("Error scanning local network:", error);
    });

  // Adding onclick functions
  let hostGameBtn = document.getElementById("hostGame");
  hostGameBtn.onclick = hostGame;

  let startGameBtn = document.getElementById("startGame");
  startGameBtn.onclick = startGame;
  startGameBtn.onmouseover = glitchSound;
}

init();

// Function to check available hosts
function searchHosts(devices) {
  devices.forEach((device) => {
    fetch(`${device}:5000`)
      .then((res) => {
        hosts.push(res);
      })
      .catch((err) => {});
  });
  showAvailableHosts();
}

function showAvailableHosts() {
  let content = "";
  if (hosts.length === 0) {
    content += "<p class='noHost'>No available hosts at the present !!!</p>";
  } else {
    content += "<div class='hostList'>";
    hosts.forEach((host) => {
      content += `<p class='hostItem'>Host Name = ${host} <button onclick='runGame(${host})'>Join</button></p>`;
    });
    content += "</div>";
  }
  let hostDiv = document.getElementById("hosts");
  hostDiv.innerHTML = content;
}

// Hosting Game
function hostGame() {
  let name = document.getElementById("name").value;
  if (name.length === 0) {
    alertError("Enter a name !!!");
    return;
  }
  ipcRenderer.send("hostName", {
    name,
  });

  let ip = address.getIpAddress();
  runGame(ip);
}

function initialize() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  document.getElementById("codeInput").value = "";
  document.onkeydown = null;
  //red Initial
  (xr = 20), (yr = 137);
  ctx.fillStyle = "red";
  ctx.fillRect(xr, yr, 10, 10);

  //green initial
  (xg = 270), (yg = 3);
  ctx.fillStyle = "green";
  ctx.fillRect(xg, yg, 10, 10);
}

function runGame(ip) {
  initialize();
  document.getElementById("landing").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  // Game Logic
  socket = io(`ws://${ip}:5000`);
  socket.on("init", (msg) => {
    id = msg.id;
    document.getElementById("code").innerText = id.substring(id.length - 5);
  });

  socket.on("responded", (res) => {
    if (!res) return;
    switch (res.move) {
      case "left":
        oppMovedRight();
        break;
      case "right":
        oppMovedLeft();
        break;
      case "shoot":
        shootLasersDown();
        break;
      default:
        console.log("Unknown response received");
    }
  });
}

function startGame() {
  code = document.getElementById("codeInput").value;
  if (!code) {
    alert("Enter Code First");
    return;
  }
  if (code.length !== 5) {
    alert("Invalid Code");
    return;
  }
  if (code === id.substring(id.length - 5)) {
    alert("You Can't play with yourself");
    return;
  }
  console.log("started");
  socket.emit("code", { code, playerId: id });
  socket.on("begin", (data) => {
    console.log(data);
    if (data.status === "error") {
      alert(data.msg);
      return;
    }
    document.onkeydown = checkKey;
    code = data.code;
    head1.classList.add("hidden");
    head2.classList.remove("hidden");
  });
}

function initialize() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  document.getElementById("codeInput").value = "";
  document.onkeydown = null;
  //red Initial
  (xr = 20), (yr = 137);
  ctx.fillStyle = "red";
  ctx.fillRect(xr, yr, 10, 10);

  //green initial
  (xg = 270), (yg = 3);
  ctx.fillStyle = "green";
  ctx.fillRect(xg, yg, 10, 10);
}

//Sounds
function moveSound() {
  var audio = document.createElement("audio");
  audio.src = "./sounds/Move.mp3";
  audio.volume = 0.7;
  audio.play();
}

function shootSound() {
  var audio = document.createElement("audio");
  audio.src = "./sounds/Shoot.mp3";
  audio.volume = 0.7;
  audio.play();
}

function glitchSound() {
  var audio = document.createElement("audio");
  audio.src = "./sounds/Glitch.mp3";
  audio.volume = 0.7;
  audio.play();
}

function checkKey(e) {
  e = e || window.event;

  if (e.keyCode == "38" || e.keyCode == "32") {
    shootLasersUp();
  } else if (e.keyCode == "37" || e.keyCode == "65") {
    leftClicked();
  } else if (e.keyCode == "39" || e.keyCode == "68") {
    rightClicked();
  }
}

function leftClicked() {
  if (xr <= 10) return;
  console.log(socket);
  socket.emit("moved", { move: "left", playerId: id, code });
  ctx.fillStyle = "red";
  ctx.clearRect(xr, yr, 10, 10);
  xr -= 10;
  ctx.fillRect(xr, yr, 10, 10);
  moveSound();
}

function oppMovedLeft() {
  if (xg <= 10) return;
  ctx.fillStyle = "green";
  ctx.clearRect(xg, yg, 10, 10);
  xg -= 10;
  ctx.fillRect(xg, yg, 10, 10);
  moveSound();
}

function oppMovedRight() {
  if (xg >= 280) return;
  ctx.fillStyle = "green";
  ctx.clearRect(xg, yg, 10, 10);
  xg += 10;
  ctx.fillRect(xg, yg, 10, 10);
  moveSound();
}

function rightClicked() {
  if (xr >= 280) return;
  socket.emit("moved", { move: "right", playerId: id, code });
  ctx.fillStyle = "red";
  ctx.clearRect(xr, yr, 10, 10);
  xr += 10;
  ctx.fillRect(xr, yr, 10, 10);
  moveSound();
}

function shootLasersUp() {
  shootSound();
  socket.emit("moved", { move: "shoot", playerId: id, code });
  let sx = xr + 4,
    sy = 113;
  ctx.fillStyle = "red";
  let intervalId = setInterval(() => {
    ctx.clearRect(sx, sy + 12, 2, 12);
    ctx.fillRect(sx, sy, 2, 12);
    sy -= 12;
    if (sy <= -10) {
      ctx.clearRect(sx, sy + 12, 2, 12);
      clearInterval(intervalId);
      if (sx === xg + 4) {
        endGame("You Won");
        initialize();
      }
    }
  }, 50);
}

function shootLasersDown() {
  shootSound();
  let sx = xg + 4,
    sy = 15;
  ctx.fillStyle = "green";
  ctx.fillRect(sx, sy, 2, 12);
  let intervalId = setInterval(() => {
    ctx.clearRect(sx, sy, 2, 12);
    sy += 12;
    ctx.fillRect(sx, sy, 2, 12);
    if (sy >= 140) {
      ctx.clearRect(sx, sy, 2, 12);
      clearInterval(intervalId);
      if (sx === xr + 4) {
        endGame("You Lost");
        initialize();
      }
    }
  }, 50);
}

function endGame(msg) {
  alert(msg);
  head1.classList.remove("hidden");
  head2.classList.add("hidden");
  initialize();
  socket.emit("gameEnded", { code });
}

// Helper Functions
function alertSuccess(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: "green",
      color: "white",
      textAlign: "center",
    },
  });
}

function alertError(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: "red",
      color: "white",
      textAlign: "center",
    },
  });
}
