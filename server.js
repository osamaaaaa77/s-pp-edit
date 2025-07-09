const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const words = ["مكياج", "اسنان", "زيتون", "ثور", "كاميرا", "شوكولاته", "بطارية", "طاولة", "زومبي", "انف", "شنب", "ممرضة", "بيت", "ذهب", "بروكلي", "ديناصور", "اسد", "طائرة", "ضفدع", "فاصوليا", "تاج"];
let currentWord = "";
let roundActive = false;

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.data.points = 0;

  const defaultName = generateUniqueName();
  socket.data.name = defaultName;
  socket.emit("set name", defaultName);

  sendStateToAll();

  socket.on("chat message", (msg) => {
    io.emit("chat message", { name: socket.data.name, msg });
  });

  socket.on("set name", (name) => {
    name = name.trim();

    // رفض تغيير الاسم إلى اسم مستخدم حالي
    if (isNameTaken(name)) {
      socket.emit("chat message", { name: "النظام", msg: `⚠️ الاسم "${name}" مستخدم من قبل.` });
      return;
    }

    socket.data.name = name;
    sendStateToAll();
    socket.emit("set name", name); // لتحديث المتغير client-side
  });

  socket.on("answer", (ans) => {
    if (!roundActive) return;
    if (ans.trim() === currentWord) {
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
    io.emit("kick message", {
      kicker: socket.data.name,
      kicked,
    });
  });

  socket.on("disconnect", () => {
    sendStateToAll();
    console.log(`اللاعب ${socket.data.name} غادر اللعبة.`);
  });
});

function usersScores() {
  const arr = [];
  for (let [id, socket] of io.of("/").sockets) {
    arr.push({
      id,
      name: socket.data.name,
      points: socket.data.points,
    });
  }
  return arr;
}

function sendStateToAll() {
  io.emit("state", {
    word: currentWord,
    scores: usersScores(),
  });
}

function nextRound() {
  currentWord = words[Math.floor(Math.random() * words.length)];
  roundActive = true;
  sendStateToAll();
  io.emit("new round", {
    word: currentWord,
    scores: usersScores(),
  });
}

function isNameTaken(name) {
  name = name.trim();
  for (let [, socket] of io.of("/").sockets) {
    if (socket.data.name === name) return true;
  }
  return false;
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
