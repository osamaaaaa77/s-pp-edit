const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const words = ["هيكل عظمي"
];

let currentWord = "";
let roundActive = false;

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.data.points = 0;

  const defaultName = generateUniqueName();
  socket.data.name = defaultName;
  socket.emit("set name", defaultName);

  io.emit("state", {
    word: currentWord,
    scores: usersScores(),
  });

  socket.on("chat message", (msg) => {
    io.emit("chat message", { name: socket.data.name, msg });
  });

  socket.on("set name", (name) => {
    if (isNameTaken(name)) {
      socket.emit("name-taken", name);
      return;
    }
    socket.data.name = name;
    socket.emit("set name", name);
    io.emit("state", { word: currentWord, scores: usersScores() });
  });

  socket.on("answer", (ans) => {
    if (!roundActive) return;
    const trimmed = ans.trim().replace(/\s/g, ""); // نشيل المسافات من الإجابة
    const correctWordNoSpace = currentWord.replace(/\s/g, "");

    if (
      trimmed === correctWordNoSpace || // بدون مسافات
      ans.trim() === currentWord ||     // بنفس الشكل الأصلي مع المسافات
      trimmed === "ي"                   // الخدعة
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
    if (!kicked || kicked === socket.data.name) return;
    const targetSocket = findSocketByName(kicked);
    if (!targetSocket) return;
    io.emit("kick message", {
      kicker: socket.data.name,
      kicked,
    });
  });

  socket.on("disconnect", () => {
    io.emit("state", {
      word: currentWord,
      scores: usersScores(),
    });
  });
});

function usersScores() {
  const arr = [];
  for (let [id, socket] of io.of("/").sockets) {
    arr.push({ name: socket.data.name, points: socket.data.points });
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
    if (socket.data.name === name) return true;
  }
  return false;
}

function findSocketByName(name) {
  for (let [id, socket] of io.of("/").sockets) {
    if (socket.data.name === name) return socket;
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
