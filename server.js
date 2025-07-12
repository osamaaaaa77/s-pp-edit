const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const adminIPs = [];

const words = ["مكياج", "اسنان", "زيتون", "ثور", "كاميرا", "شوكولاته", "بطارية", "طاولة",
  "زومبي", "انف", "شنب", "ممرضة", "بيت", "ذهب", "بروكلي", "ديناصور", "اسد",
  "طائرة", "ضفدع", "فاصوليا", "تاج", "سنجاب", "دجاج", "طريق", "كوالا", "فراشة",
  "يضحك", "تبولة", "سحلية", "شامبو", "محفظة", "نجوم", "باص", "صيدلي", "مخدة",
  "شارع", "زيت", "جاكيت", "اخطبوط", "ابرة", "قارورة", "فهد", "ذئب", "حلاوة",
  "مصاصة", "كتاب", "زهرة", "بطريق", "معدة", "رقص", "كرة قدم", "خفاش", "دفتر",
  "فطيرة", "مسرح", "غيوم", "قمر", "صحن", "ورق عنب", "وردة", "كأس", "فرس النهر",
  "نسر", "ثوب", "عسل", "جمل", "مسمار", "مدينة", "دباب", "مسطرة", "طاووس",
  "خس", "كوخ", "مايك", "طباخ", "افوكادو", "درع", "قنبلة",  "رمح", "مرآة",
  "ملك", "حمام", "فستان", "جبن", "محاسب", "مدرسة", "عامل نظافة", "مكنسة",
  "كيس", "توصيلة", "شراب",  "بطة", "جدار", "شماغ", "كريب", "لابتوب",
  "ملوخية", "كرز", "عشب", "بطيخ", "تلفاز", "طيار", "شاحن", "رسام", "قهوة",
  "جزيرة", "صابون", "ساعة يد", "كرسي", "جبل", "عصفور", "ثعبان", "ملفوف",
  "كرة سلة", "برياني", "قلعة", "كبة", "كوكب", "حزين", "سبانخ", "سوشي", "هاتف",
  "ساعة", "ورقة", "عين", "بومة", "لاما", "ماء", "خريطة", "نظارة", "علبة", "شبح",
  "كنافة", "سمبوسة", "سمكة", "دمية", "قفل", "اعصار", "يبكي", "بطاطس", "صلعه",
  "اذن", "نافذة", "ممثل", "فيل", "ريموت", "شاطئ", "فيش", "حبل", "حامل", "سماء",
  "سجادة", "سلم",  "مندي", "ذرة", "نعامة", "عصا", "خبز", "صائغ", "كب كيك",
  "طفل", "قاضي", "سيارة", "بيتزا", "بيض", "مقلوبة", "عائلة",  "يد", "بائع",
  "ديك", "ظفر", "شريط", "شاي", "حصان", "ستارة", "مروحة", "سكين", "نجار",
  "سلسلة", "مجرة", "فم", "دب قطبي", "وحيد القرن", "حليب", "سماعة", "رز",
  "شتاء", "مرحاض", "سلة", "سلطة", "هرم", "لسان", "يمشي", "قنديل", "خلاط", "مكرونة",
  "فرشاة", "سلك", "عطر", "كرة", "برج ايفل", "قرد", "قلم رصاص", "هيكل عظمي", "فطر",
  "غراب", "فلاشة", "حفرة", "مانجو", "ساعة رملية", "قبعة", "اطفائي", "الماس",
  "ثعلب", "خروف", "ستيك", "مطرقة", "ارنب", "كبسة", "سجاده", "فانوس", "كيبورد",
  "كنز", "يركض", "موية", "ملح", "قلب", "جرس", "خياط", "بيانو", "شمعة", "سلطعون",
  "مسدس", "اصبع", "حمار", "كشري", "زبالة", "باذنجان", "رمان", "جوز الهند", "شاحنة",
  "لحم", "مذيع", "كهربائي", "كباب", "كمبيوتر", "رموش", "سروال", "مستشفى", "وسادة",
  "صرصور", "علم", "صاروخ", "فول", "عظم", "الارض", "سجق", "باب", "كنبة", "حديقة",
  "بصل", "فأر", "مظلة", "قوس قزح", "خيمة", "دجاج مشوي", "مغني", "جوافة", "حلزون",
  "قدم", "نهر", "فشار", "مزرعة", "حوت", "سيف", "طابعة", "غزال", "هدية", "مهندس",
  "بطاطا", "زرافة", "دونات", "الكعبة", "فرن", "جامعة", "مكيف", "ماعز", 
  "مكتب", "منشار", "ماوس", "دكتور", "سبورة", "مكتبة", "فأس", "جوال", "قطايف",
  "خوخ", "بسكوت", "حجر", "خشب", "معلم", "مطبخ", "جالس", "بطن", "قوس", "ايس كريم",
  "قرش", "طاوله", "غرفة", "حاجب", "عنب", "جوارب", "برج خليفة", "موز",
  "دولاب", "روبوت", "سرير", "مسبح", "نعال", "شاشة", "وحش", "فقمة", "ملعب", "سينما",
  "حمص", "جاموس", "ولاعة", "صقر", "جزر", "قدر", "سفينة", "هدهد", "تنين", "نقانق",
  "نار", "مشط", "عصير", "قميص", "فلوس", "ليل", "بامية", "شوربة", "فرشة", "خيار",
  "عنكبوت", "طبل", "نخلة", "دودة", "برق", "ثلج", "حلاق", "برجر", "مزهرية", "ببغاء",
  "باندا", "يسبح", "ملعقة", "مطعم", "زر", "كنغر", "تفاح", "بقلاوة", "كوب", "ليمون",
  "ثلاجة", "فراولة", "غوريلا", "تمر", "حذاء", "تمساح", "نمر", "كاتشب", "منسف",
  "صندوق", "برتقال", "مكة", "شرطي", "شجرة", "عدس", "جمجمة", "غسالة", "فلفل",
  "اشارة مرور", "غابة", "ميكانيكي", "روبيان", "سائق", "عقرب", "قلم", "محامي",
  "اناناس", "شوكة", "بحر", "طماطم", "كيك", "قنفذ", "دم", "قارب", "صبار", "بقرة",
  "شطرنج", "لاعب", "شلال", "خنزير", "برج", "حمار وحشي", "دبابة", "عمارة", "دباسة",
  "نوم", "نمل", "مصور", "صحراء", "ذبابة", "ثوم", "شمام", "نحلة", "منديل",
  "قطة", "مسجد", "مفتاح", "راكون", "دراجة", "كنب", "مطر", "قطار", "بطه", "سلحفاة",
  "بلياردو", "مقص", "حقيبة", "شنطة", "فراخ", "ضبع", "كلب", "شاورما", "خاتم",
  "مصباح", "دولفين", "افعى", "سكر", "بركان", "غواصة", "دب"
];

let currentWord = "";
let roundActive = false;
const playersPoints = {}; // النقاط مخزنة حسب playerID
const mutedPlayers = new Set();

app.use(express.static("public"));

io.on("connection", (socket) => {
  const clientIP = socket.handshake.address;
  const isObserver = socket.handshake.headers.referer?.includes("observer=");
  socket.data.observer = isObserver;
  socket.data.isAdmin = adminIPs.includes(clientIP);

  // استلام playerID من العميل عبر query
  let playerID = socket.handshake.query.playerID;
  if (!playerID) {
    playerID = generateUniqueID();
    socket.emit("set id", playerID);
  }
  socket.data.playerID = playerID;

  if (!isObserver) {
    if (!playersPoints[playerID]) playersPoints[playerID] = 0;
    socket.data.points = playersPoints[playerID];
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
      playersPoints[playerID] = (playersPoints[playerID] || 0) + 1;
      socket.data.points = playersPoints[playerID];
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

function usersScores() {
  const arr = [];
  for (let [id, socket] of io.of("/").sockets) {
    if (!socket.data.observer) {
      arr.push({ name: socket.data.name, points: playersPoints[socket.data.playerID] || 0 });
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

function generateUniqueID() {
  return 'id-' + Math.random().toString(36).substr(2, 9);
}

http.listen(process.env.PORT || 3000, () => {
  console.log("Started");
  nextRound();
});
