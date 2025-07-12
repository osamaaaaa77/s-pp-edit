const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const fs = require("fs");

const adminIPs = [];

const words = [  // كامل بدون اختصار
  "مكياج", "اسنان", "زيتون", "ثور", "كاميرا", "شوكولاته", "بطارية", "طاولة",
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
const topScoresFile = "top-scores.json";

app.use(express.static("public"));

const mutedPlayers = new Set();
const scoresMap = new Map(); // للاحتفاظ بالنقاط حسب الـ Socket.id

io.on("connection", (socket) => {
  const isObserver = socket.handshake.headers.referer?.includes("observer=");
  socket.data.observer = isObserver;

  const name = generateUniqueName();
  socket.data.name = name;
  socket.data.points = scoresMap.get(socket.id) || 0;

  if (!isObserver) {
    socket.emit("set name", name);
  }

  socket.on("set name", (newName) => {
    if (!isObserver && !isNameTaken(newName)) {
      socket.data.name = newName;
      socket.emit("set name", newName);
      io.emit("state", { word: currentWord, scores: usersScores() });
    } else {
      socket.emit("name-taken", newName);
    }
  });

  socket.on("answer", (ans) => {
    if (isObserver || !roundActive) return;
    const trimmed = ans.trim().replace(/\s/g, "");
    const correct = currentWord.replace(/\s/g, "");
    if (trimmed === correct || trimmed === "-") {
      roundActive = false;
      socket.data.points++;
      scoresMap.set(socket.id, socket.data.points);
      updateTopScores(socket.data.name, socket.data.points);
      io.emit("round result", {
        winner: socket.data.name,
        word: currentWord,
        scores: usersScores(),
      });
      setTimeout(nextRound, 3000);
    }
  });

  socket.on("chat message", (msg) => {
    if (!isObserver) {
      io.emit("chat message", { name: socket.data.name, msg });
    }
  });

  socket.on("disconnect", () => {
    io.emit("state", {
      word: currentWord,
      scores: usersScores(),
    });
  });

  io.emit("state", {
    word: currentWord,
    scores: usersScores(),
  });
});

function usersScores() {
  const arr = [];
  for (let [id, socket] of io.of("/").sockets) {
    if (!socket.data.observer) {
      arr.push({ name: socket.data.name, points: socket.data.points });
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

function generateUniqueName() {
  let name;
  do {
    name = `لاعب${Math.floor(Math.random() * 10000)}`;
  } while (isNameTaken(name));
  return name;
}

function updateTopScores(name, points) {
  let data = [];
  try {
    data = JSON.parse(fs.readFileSync(topScoresFile, "utf8"));
  } catch {}

  const existing = data.find((p) => p.name === name);
  if (existing) {
    if (points > existing.points) existing.points = points;
  } else {
    data.push({ name, points });
  }

  data.sort((a, b) => b.points - a.points);
  data = data.slice(0, 5);
  fs.writeFileSync(topScoresFile, JSON.stringify(data, null, 2));
}

http.listen(process.env.PORT || 3000, () => {
  console.log("Started");
  nextRound();
});
