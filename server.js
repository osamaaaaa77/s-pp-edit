const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const words = [/* كلمات كثيرة كما في كودك الأصلي */];
let currentWord = "";
let roundActive = false;

// تخزين آخر وقت طرد لكل لاعب (id => timestamp)
const lastKickTimes = new Map();

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.data.points = 0;
  socket.data.name = `لاعب${Math.floor(Math.random() * 10000)}`;

  socket.emit("set name", socket.data.name);

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

  // استقبال حدث طرد لاعب
  socket.on("kick player", (targetName) => {
    // الوقت الحالي
    const now = Date.now();
    const lastKick = lastKickTimes.get(socket.id) || 0;

    // تحقق من وقت آخر طرد
    if (now - lastKick < 10000) {
      // أرسل رسالة خاصة للمرسل أن عليه الانتظار
      socket.emit("chat message", {
        name: "النظام",
        msg: "انتظر 10 ثواني قبل محاولة طرد جديدة.",
        system: true,
      });
      return;
    }

    // تحديث وقت الطرد الأخير
    lastKickTimes.set(socket.id, now);

    // البحث عن الهدف بالاسم
    let targetSocket = null;
    for (let [id, s] of io.of("/").sockets) {
      if (s.data.name === targetName) {
        targetSocket = s;
        break;
      }
    }
    if (!targetSocket) {
      // الهدف غير موجود
      socket.emit("chat message", {
        name: "النظام",
        msg: `لاعب باسم ${targetName} غير موجود.`,
        system: true,
      });
      return;
    }

    // لا تسمح بطرد النفس
    if (targetSocket.id === socket.id) {
      socket.emit("chat message", {
        name: "النظام",
        msg: "لا يمكنك طرد نفسك.",
        system: true,
      });
      return;
    }

    // بث رسالة طرد حمراء في الشات بدون طرد فعلي (مجرد شكل)
    io.emit("kick message", {
      from: socket.data.name,
      to: targetName,
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

http.listen(process.env.PORT || 3000, () => {
  console.log("Started");
  nextRound();
});
