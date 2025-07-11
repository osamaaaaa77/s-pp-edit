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
let mutedPlayers = new Set();

changeName.onclick = () => {
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
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("new round", (data) => {
  currentWord.textContent = data.word;
  answerInput.value = "";
  answerChat.innerHTML = "";
  renderScores(data.scores);
});

socket.on("round result", (data) => {
  answerChat.textContent = `✔️ ${data.winner} جاوب`;
  renderScores(data.scores);
});

socket.on("state", (data) => {
  currentWord.textContent = data.word;
  renderScores(data.scores);
});

socket.on("chat message", (data) => {
  if (mutedPlayers.has(data.name)) return;
  const div = document.createElement("div");
  div.textContent = `${data.name}: ${data.msg}`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("kick message", (data) => {
  const div = document.createElement("div");
  div.textContent = `${data.kicker} يطرد ${data.kicked}`;
  div.style.color = "red";
  div.style.fontWeight = "bold";
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

answerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const ans = answerInput.value.trim();
    if (ans !== "") {
      socket.emit("answer", ans);
    }
    answerInput.value = "";
  }
});

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (msg !== "") {
      socket.emit("chat message", msg);
    }
    chatInput.value = "";
  }
});

function renderScores(scores) {
  scoresDiv.innerHTML = "";
  scores.sort((a, b) => b.points - a.points);
  scores.forEach((p) => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.gap = "8px";
    div.style.marginBottom = "6px";

    const textSpan = document.createElement("span");
    textSpan.textContent = `${p.name}: ${p.points}`;
    div.appendChild(textSpan);

    const pingSpan = document.createElement("span");
    pingSpan.textContent = `🏓 ${p.ping ?? 0} ms`;
    pingSpan.style.fontSize = "11px";
    pingSpan.style.color = "#aaa";
    div.appendChild(pingSpan);

    if (p.name !== myName) {
      const muteBtn = document.createElement("button");
      muteBtn.textContent = mutedPlayers.has(p.name) ? "إلغاء الميوت" : "ميوت";
      muteBtn.title = "كتم/إلغاء كتم هذا اللاعب";
      muteBtn.style.fontSize = "11px";
      muteBtn.style.padding = "2px 6px";
      muteBtn.style.backgroundColor = mutedPlayers.has(p.name) ? "#a00" : "#f0a";
      muteBtn.style.color = "white";
      muteBtn.style.border = "none";
      muteBtn.style.borderRadius = "3px";
      muteBtn.style.cursor = "pointer";

      muteBtn.onclick = () => {
        socket.emit("mute player", p.name);
        if (mutedPlayers.has(p.name)) mutedPlayers.delete(p.name);
        else mutedPlayers.add(p.name);
        renderScores(scores);
      };

      div.appendChild(muteBtn);
    }

    // زر كك (للطرد شكلي فقط)
    if (p.name !== myName) {
      const kickBtn = document.createElement("button");
      kickBtn.textContent = "كك";
      kickBtn.title = "اضغط لطرد هذا اللاعب (تأثير شكلي)";
      kickBtn.style.fontSize = "10px";
      kickBtn.style.padding = "1px 5px";
      kickBtn.style.backgroundColor = "#f0a";
      kickBtn.style.color = "white";
      kickBtn.style.border = "none";
      kickBtn.style.borderRadius = "3px";
      kickBtn.style.cursor = "pointer";

      kickBtn.onclick = () => {
        const now = Date.now();
        if (now - lastKickTime < 10000) return;
        lastKickTime = now;
        socket.emit("kick player", { kicked: p.name });
      };

      div.appendChild(kickBtn);
    }

    scoresDiv.appendChild(div);
  });
}
