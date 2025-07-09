const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const words = [ /* كلمات اللعبة كما هي */ /* (احتفظ بقائمة الكلمات كما في كودك) */ ];

let currentWord = "";
let roundActive = false;

app.use(express.static("public"));

// لتعريف مسؤول (Admin) عن طريق أول لاعب يدخل أو اسم معين
let adminSocketId = null;

io.on("connection", (socket) => {
  socket.data.points = 0;

  // تعيين اسم افتراضي
  const defaultName = `لاعب${Math.floor(Math.random() * 10000)}`;
  socket.data.name = defaultName;
  socket.emit("set name", defaultName);

  // تعيين أول متصل كمسؤول
  if (!adminSocketId) {
    adminSocketId = socket.id;
    socket.data.isAdmin = true;
    socket.emit("admin status", true);
  } else {
    socket.data.isAdmin = false;
    socket.emit("admin status", false);
  }

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

  // استقبال طلب الطرد
  socket.on("kick player", (kickId) => {
    // فقط المسؤول يمكنه الطرد
    if (socket.id !== adminSocketId) return;

    const kickSocket = io.of("/").sockets.get(kickId);
    if (kickSocket) {
      kickSocket.emit("kicked");
      kickSocket.disconnect(true);
    }
  });

  // عند انقطاع الاتصال، إذا كان هو المسؤول، عين مسؤول جديد
  socket.on("disconnect", () => {
    if (socket.id === adminSocketId) {
      adminSocketId = null;
      // عيّن مسؤول جديد إذا موجود
      const sockets = Array.from(io.of("/").sockets.values());
      if (sockets.length > 0) {
        adminSocketId = sockets[0].id;
        sockets[0].data.isAdmin = true;
        sockets[0].emit("admin status", true);
      }
    }
  });
});

function usersScores() {
  const arr = [];
  for (let [id, socket] of io.of("/").sockets) {
    arr.push({ id, name: socket.data.name, points: socket.data.points });
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
