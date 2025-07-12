const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const adminIPs = ["156.38.42.220", "38.252.51.107"];
const words = [/* ... كلماتك بدون تغيير ... */];

let currentWord = "";
let roundActive = false;
const mutedPlayers = new Set();

app.use(express.static("public"));

io.on("connection", (socket) => {
  const clientIP = socket.handshake.address;
  const isObserver = socket.handshake.headers.referer?.includes("observer=");
  socket.data.observer = isObserver;
  socket.data.isAdmin = adminIPs.includes(clientIP);
  socket.data.ping = 0;

  if (!isObserver) {
    socket.data.points = 0;
    const defaultName = generateUniqueName();
    socket.data.name = defaultName;
    socket.emit("set name", defaultName);
  }

  socket.emit("set name", socket.data.name);
  updateAllStates();

  const pingInterval = setInterval(() => {
    const start = Date.now();
    socket.emit("ping-check", () => {
      const latency = Date.now() - start;
      socket.data.ping = latency;
      updateAllStates();
    });
  }, 3000);

  socket.on("chat message", (msg) => {
    if (socket.data.observer) return;
    if (mutedPlayers.has(socket.data.name) && !socket.data.isAdmin) return;
    io.emit("chat message", { name: socket.data.name, msg });
  });

  socket.on("set name", (name) => {
    if (socket.data.observer) return;
    if (isNameTaken(name)) {
      socket.emit("name-taken", name);
      return;
    }
    socket.data.name = name;
    socket.emit("set name", name);
    updateAllStates();
  });

  socket.on("answer", (ans) => {
    if (socket.data.observer || !roundActive) return;
    const trimmed = ans.trim().replace(/\s/g, "");
    const correct = currentWord.replace(/\s/g, "");

    if (trimmed === correct || ans.trim() === currentWord || trimmed === "-") {
      roundActive = false;
      socket.data.points++;
      io.emit("round result", {
        winner: socket.data.name,
        word: currentWord,
        scores: usersScores(),
      });
      setTimeout(nextRound, 3000);
    }
  });

  socket.on("kick player", ({ kicked }) => {
    if (!socket.data.isAdmin || !kicked || kicked === socket.data.name) return;
    const target = findSocketByName(kicked);
    if (!target) return;
    io.emit("kick message", {
      kicker: socket.data.name,
      kicked,
    });
  });

  socket.on("mute player", ({ muted }) => {
    if (!socket.data.isAdmin || !muted) return;
    mutedPlayers.add(muted);
  });

  socket.on("unmute player", ({ unmuted }) => {
    if (!socket.data.isAdmin || !unmuted) return;
    mutedPlayers.delete(unmuted);
  });

  socket.on("disconnect", () => {
    clearInterval(pingInterval);
    updateAllStates();
  });
});

function usersScores() {
  const arr = [];
  for (let [_, socket] of io.of("/").sockets) {
    if (!socket.data.observer) {
      arr.push({
        name: socket.data.name,
        points: socket.data.points,
        ping: socket.data.ping || 0,
      });
    }
  }
  return arr;
}

function updateAllStates() {
  io.emit("state", {
    word: currentWord,
    scores: usersScores(),
  });
}

function nextRound() {
  currentWord = words[Math.floor(Math.random() * words.length)];
  roundActive = true;
  updateAllStates();
  io.emit("new round", { word: currentWord, scores: usersScores() });
}

function isNameTaken(name) {
  for (let [_, socket] of io.of("/").sockets) {
    if (!socket.data.observer && socket.data.name === name) return true;
  }
  return false;
}

function findSocketByName(name) {
  for (let [_, socket] of io.of("/").sockets) {
    if (!socket.data.observer && socket.data.name === name) return socket;
  }
  return null;
}

function generateUniqueName() {
  let name;
  do {
    name = `لاعب${Math.floor(Math.random() * 10000)}`;
  } while (isNameTaken(name));
  return name;
}

http.listen(process.env.PORT || 3000, () => {
  console.log("Started");
  nextRound();
});
