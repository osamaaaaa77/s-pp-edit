const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const adminIPs = [];

const words = [/* قائمة الكلمات كما هي بدون تغيير */ "مكياج", "اسنان", "زيتون", ... "دب"];

let currentWord = "";
let roundActive = false;

app.use(express.static("public"));

io.on("connection", (socket) => {
  const clientIP = socket.handshake.address;
  const isObserver = socket.handshake.headers.referer?.includes("observer=");
  socket.data.observer = isObserver;
  socket.data.isAdmin = adminIPs.includes(clientIP);

  if (!isObserver) {
    socket.data.points = 0;
    const defaultName = generateUniqueName();
    socket.data.name = defaultName;
    socket.emit("set name", defaultName);
  }

  io.emit("state", {
    word: currentWord,
    scores: usersScores(),
  });

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
    io.emit("state", { word: currentWord, scores: usersScores() });
  });

  socket.on("answer", (ans) => {
    if (socket.data.observer) return;
    if (!roundActive) return;
    const trimmed = ans.trim().replace(/\s/g, "");
    const correctWordNoSpace = currentWord.replace(/\s/g, "");

    if (
      trimmed === correctWordNoSpace ||
      ans.trim() === currentWord ||
      trimmed === "-"
    ) {
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
    if (socket.data.observer) return;
    if (!socket.data.isAdmin) return;
    if (!kicked || kicked === socket.data.name) return;
    const targetSocket = findSocketByName(kicked);
    if (!targetSocket) return;
    io.emit("kick message", {
      kicker: socket.data.name,
      kicked,
    });
  });

  socket.on("mute player", ({ muted }) => {
    if (!socket.data.isAdmin) return;
    if (!muted) return;
    mutedPlayers.add(muted);
  });

  socket.on("unmute player", ({ unmuted }) => {
    if (!socket.data.isAdmin) return;
    if (!unmuted) return;
    mutedPlayers.delete(unmuted);
  });

  socket.on("disconnect", () => {
    io.emit("state", {
      word: currentWord,
      scores: usersScores(),
    });
  });
});

const mutedPlayers = new Set();

function usersScores() {
  const arr = [];
  for (let [id, socket] of io.of("/").sockets) {
    if (!socket.data.observer) {
      const ping = socket.conn.latency || 0;
      arr.push({
        name: socket.data.name,
        points: socket.data.points,
        ping: Math.round(ping)
      });
    }
  }
  return arr;
}

function nextRound() {
  currentWord = words[Math.floor(Math.random() * words.length)];
  roundActive = true;
  io.emit("new round", { word: currentWord, scores: usersScores() });
}

function isNameTaken(name) {
  for (let [id, socket] of io.of("/").sockets) {
    if (!socket.data.observer && socket.data.name === name) return true;
  }
  return false;
}

function findSocketByName(name) {
  for (let [id, socket] of io.of("/").sockets) {
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
