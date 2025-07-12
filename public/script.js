const socket = io();

const currentWord = document.getElementById("current-word");
const answerInput = document.getElementById("answer");
const answerChat = document.getElementById("answer-chat");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const scoresDiv = document.getElementById("scores");
const changeName = document.getElementById("change-name");

let myName = null;
let playerID = localStorage.getItem("playerID") || null;
const isObserver = window.location.search.includes("observer=");

// قائمة أسماء اللاعبين المكتومين محلياً
let mutedPlayers = JSON.parse(localStorage.getItem("mutedPlayers") || "{}");

// عند الاتصال أرسل معرف اللاعب أو null ليتم إنشاؤه من السيرفر
socket.emit("init", playerID);

// استلام معرف جديد من السيرفر (إذا تم إنشاؤه)
socket.on("set id", (id) => {
  playerID = id;
  localStorage.setItem("playerID", playerID);
});

// استقبال تعيين الاسم
socket.on("set name", (name) => {
  myName = name;
});

// عند تغيير الاسم عبر الزر
changeName.onclick = () => {
  if (isObserver) return;
  const name = prompt("اكتب اسمك:");
  if (name) socket.emit("set name", name);
};

// استقبال الاسم المرفوض
socket.on("name-taken", (name) => {
  const div = document.createElement("div");
  div.textContent = `⚠️ هذا الاسم "${name}" مستخدم`;
  div.style.color = "blue";
  div.style.fontWeight = "bold";
  chatMessages.appendChild(div);
  scrollChatToBottom();
});

// استقبال جولة جديدة
socket.on("new round", (data) => {
  currentWord.textContent = data.word;
  answerInput.value = "";
  answerChat.innerHTML = "";
  renderScores(data.scores);
});

// استقبال نتيجة الجولة
socket.on("round result", (data) => {
  answerChat.textContent = `✅ ${data.winner} جاوب`;
  renderScores(data.scores);
});

// استقبال الحالة العامة
socket.on("state", (data) => {
  currentWord.textContent = data.word;
  renderScores(data.scores);
});

// استقبال رسائل الشات
socket.on("chat message", (data) => {
  if (mutedPlayers[data.name]) return;

  const div = document.createElement("div");
  div.textContent = `${data.name}: ${data.msg}`;
  chatMessages.appendChild(div);
  scrollChatToBottom();
});

// استقبال رسائل الطرد
socket.on("kick message", (data) => {
  const div = document.createElement("div");
  div.textContent = `${data.kicker} يطرد ${data.kicked}`;
  div.style.color = "red";
  div.style.fontWeight = "bold";
  chatMessages.appendChild(div);
  scrollChatToBottom();
});

// إرسال الإجابة عند الضغط على Enter
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

// إرسال رسالة الشات عند الضغط على Enter
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

// عرض النقاط مع زر الكتم
function renderScores(scores) {
  scoresDiv.innerHTML = "";

  // ترتيب النقاط تنازلياً
  scores.sort((a, b) => b.points - a.points);

  // عرض النقاط
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

  displayTopScores();
}

// عرض أعلى النقاط محفوظة محلياً
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
    div.textContent = `${i + 1}. ${p.name}: ${p.points}`;
    div.style.padding = "2px 0";
    div.style.color = "#004080";
    scoresDiv.appendChild(div);
  });
}

function scrollChatToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
