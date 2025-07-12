const socket = io();

const currentWord = document.getElementById("current-word");
const answerInput = document.getElementById("answer");
const answerChat = document.getElementById("answer-chat");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const scoresDiv = document.getElementById("scores");
const changeName = document.getElementById("change-name");

let myName = null;
let lastKickTime = 0;
const isObserver = window.location.search.includes("observer=");

// قائمة أسماء اللاعبين المكتومين محلياً
let mutedPlayers = JSON.parse(localStorage.getItem("mutedPlayers") || "{}");

// زر تغيير الاسم
changeName.onclick = () => {
  if (isObserver) return;
  const name = prompt("اكتب اسمك:");
  if (name) socket.emit("set name", name);
};

socket.on("set name", (name) => {
  myName = name;
});

socket.on("name-taken", (name) => {
  const div = document.createElement("div");
  div.textContent = `⚠️ هذا الاسم "${name}" مستخدم`;
  div.style.color = "blue";
  div.style.fontWeight = "bold";
  chatMessages.appendChild(div);
  scrollChatToBottom();
});

socket.on("new round", (data) => {
  currentWord.textContent = data.word;
  answerInput.value = "";
  answerChat.innerHTML = "";
  renderScores(data.scores);
});

socket.on("round result", (data) => {
  answerChat.textContent = `✅ ${data.winner} جاوب`;
  renderScores(data.scores);
});

socket.on("state", (data) => {
  currentWord.textContent = data.word;
  renderScores(data.scores);
});

// استقبال رسالة شات عادية
socket.on("chat message", (data) => {
  if (mutedPlayers[data.name]) return;

  const div = document.createElement("div");
  div.textContent = `${data.name}: ${data.msg}`;
  chatMessages.appendChild(div);
  scrollChatToBottom();
});

// استقبال رسالة نظامية (دخول/خروج)
socket.on("system message", (data) => {
  const div = document.createElement("div");
  div.textContent = data.msg;
  div.style.color = data.color || "black";
  div.style.fontWeight = "bold";
  chatMessages.appendChild(div);
  scrollChatToBottom();
});

socket.on("kick message", (data) => {
  const div = document.createElement("div");
  div.textContent = `${data.kicker} يطرد ${data.kicked}`;
  div.style.color = "red";
  div.style.fontWeight = "bold";
  chatMessages.appendChild(div);
  scrollChatToBottom();
});

// إرسال الإجابة
answerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (isObserver) return;
    const ans = answerInput.value.trim();
    if (ans !== "") {
      socket.emit("answer", ans);
    }
    answerInput.value = "";
  }
});

// إرسال رسالة شات
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (isObserver) return;
    const msg = chatInput.value.trim();
    if (msg !== "") {
      socket.emit("chat message", msg);
    }
    chatInput.value = "";
  }
});

// عرض النقاط مع زر الكتم الخاص بك
function renderScores(scores) {
  scoresDiv.innerHTML = "";

  scores.sort((a, b) => b.points - a.points);

  scores.forEach((p) => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.gap = "6px";

    const textSpan = document.createElement("span");
    textSpan.textContent = `${p.name}: ${p.points}`;
    div.appendChild(textSpan);

    if (!isObserver && p.name !== myName) {
      const muteBtn = document.createElement("button");
      muteBtn.textContent = mutedPlayers[p.name] ? "🔇" : "🔊";
      muteBtn.title = mutedPlayers[p.name] ? "إلغاء كتم اللاعب" : "كتم اللاعب";
      muteBtn.style.fontSize = "14px";
      muteBtn.style.padding = "1px 6px";
      muteBtn.style.backgroundColor = mutedPlayers[p.name] ? "#888" : "#ccc";
      muteBtn.style.color = "black";
      muteBtn.style.border = "none";
      muteBtn.style.borderRadius = "3px";
      muteBtn.style.cursor = "pointer";

      muteBtn.onclick = () => {
        if (mutedPlayers[p.name]) {
          delete mutedPlayers[p.name];
        } else {
          mutedPlayers[p.name] = true;
        }
        localStorage.setItem("mutedPlayers", JSON.stringify(mutedPlayers));
        renderScores(scores);
      };

      div.appendChild(muteBtn);
    }

    scoresDiv.appendChild(div);
  });

  saveTopScores(scores);
  displayTopScores();
}

function saveTopScores(scores) {
  const top5 = scores.slice(0, 5).map(p => ({name: p.name, points: p.points}));
  let saved = JSON.parse(localStorage.getItem("topScores") || "[]");

  top5.forEach(newScore => {
    const index = saved.findIndex(s => s.name === newScore.name);
    if (index === -1) {
      saved.push(newScore);
    } else {
      if (newScore.points > saved[index].points) {
        saved[index].points = newScore.points;
      }
    }
  });

  saved.sort((a,b) => b.points - a.points);
  saved = saved.slice(0,5);
  localStorage.setItem("topScores", JSON.stringify(saved));
}

function displayTopScores() {
  let topScores = JSON.parse(localStorage.getItem("topScores") || "[]");
  if (!topScores.length) return;

  const title = document.createElement("div");
  title.textContent = "Top Scores";
  title.style.fontWeight = "bold";
  title.style.marginTop = "12px";
  title.style.fontSize = "18px";
  title.style.color = "#007acc";
  scoresDiv.appendChild(title);

  topScores.forEach((p, i) => {
    const div = document.createElement("div");
    div.textContent = `${i+1}. ${p.name}: ${p.points}`;
    div.style.padding = "2px 0";
    div.style.color = "#004080";
    scoresDiv.appendChild(div);
  });
}

function scrollChatToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
