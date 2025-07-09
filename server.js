const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const words = [ "مكياج", "اسنان", "زيتون", "ثور", "كاميرا", "شوكولاته", "بطارية", "طاولة", "زومبي", "انف", "شنب", "ممرضة", "بيت", "ذهب", "بروكلي", "ديناصور", "اسد", "طائرة", "ضفدع", "فاصوليا", "تاج" ];
let currentWord = "";
let roundActive = false;

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.data.points = 0;

  const defaultName = `لاعب${Math.floor(Math.random() * 10000)}`;
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
    socket.data.name = name;
    io.emit("state", { word: currentWord, scores: usersScores() });
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
});

function usersScores() {
  const arr = [];
  for (let [id, socket] of io.of("/").sockets) {
    arr.push({
      id, // <-- مهم جداً لإخفاء زر "كك" عن نفسك
      name: socket.data.name,
      points: socket.data.points,
    });
  }
  return arr;
}

function nextRound() {
  currentWord = words[Math.floor(Math.random() * words.length)];
  roundActive = true;
  io.emit("new round", { word: currentWord, scores: usersScores() });
}

http.listen(process.env.PORT || 3000, () => {
  console.log("Started");
  nextRound();
});
