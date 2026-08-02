/**
 * @file priere.js
 * @description Notification Globale de Prière avec Canvas Ultra-Décoré et diffusion progressive anti-spam.
 * @author Système 🇨🇩
 * @version 4.1.1
 */

const cron = require("node-cron");
const { createCanvas } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "priere_global_config.json");

function getGlobalStatus() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({ enabled: true }));
      return true;
    }
    const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    return data.enabled !== undefined ? data.enabled : true;
  } catch (e) {
    return true;
  }
}

function setGlobalStatus(status) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ enabled: status }, null, 2));
  } catch (e) {}
}

const PRAYERS_DATA = {
  "06:00": {
    title: "PRIÈRE DU MATIN",
    hour: "06H00",
    verses: [
      "Éternel ! Le matin tu entends ma voix ; Le matin je me tourne vers toi, et je regarde. — Psaume 5:3",
      "Les bontés de l'Éternel ne sont pas épuisées, ses compassions se renouvellent chaque matin. — Lamentations 3:22-23",
      "Confie à l'Éternel tes œuvres, et tes projets réussiront. — Proverbes 16:3"
    ],
    caption: "🌅 **NOTIFICATION OFFICIELLE DE PRIÈRE (06H00)**\n\nC'est le moment de bénir votre journée et de remettre vos projets au Seigneur !"
  },
  "12:00": {
    title: "PRIÈRE DE MIDI",
    hour: "12H00",
    verses: [
      "Le soir, le matin, et à midi, je soupire et je gémis, et il entendra ma voix. — Psaume 55:17",
      "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ton intelligence. — Proverbes 3:5",
      "Le nom de l'Éternel est une tour forte ; le juste s'y réfugie, et se trouve en sûreté. — Proverbes 18:10"
    ],
    caption: "☀️ **NOTIFICATION OFFICIELLE DE PRIÈRE (12H00)**\n\nPause spirituelle au milieu du jour. Rechargez vos forces en Christ !"
  },
  "18:00": {
    title: "PRIÈRE DU SOIR",
    hour: "18H00",
    verses: [
      "Que ma prière soit devant ta face comme l'encens, et l'élévation de mes mains comme l'offrande du soir ! — Psaume 141:2",
      "L'Éternel gardera ton départ et ton arrivée, dès maintenant et à jamais. — Psaume 121:8",
      "Dans la crainte de l'Éternel est une ferme confiance, et ses enfants ont un refuge auprès de lui. — Proverbes 14:26"
    ],
    caption: "🌆 **NOTIFICATION OFFICIELLE DE PRIÈRE (18H00)**\n\nRendez grâce à Dieu pour sa fidélité et sa protection durant cette journée."
  },
  "20:25": {
    title: "PRIÈRE DE L'ESPÉRANCE",
    hour: "20H25",
    verses: [
      "Décharge-toi sur l'Éternel de ton fardeau, et il te soutiendra. — Psaume 55:22",
      "Je me couche et je m'endors en paix, car toi seul, ô Éternel ! tu me fais habiter en sécurité. — Psaume 4:8"
    ],
    caption: "🌙 **NOTIFICATION OFFICIELLE DE PRIÈRE (20H25)**\n\nPréparez votre esprit au repos de la nuit dans la paix et l'intercession."
  },
  "20:35": {
    title: "PRIÈRE DE SAINTE COMMUNION",
    hour: "20H35",
    verses: [
      "Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux. — Matthieu 18:20",
      "Priez sans cesse. Rendez grâces en toutes choses. — 1 Thessaloniciens 5:17-18"
    ],
    caption: "✨ **NOTIFICATION OFFICIELLE DE PRIÈRE (20H35)**\n\nUnissons nos voix et nos cœurs pour la prière commune !"
  },
  "00:00": {
    title: "PRIÈRE DE MINUIT",
    hour: "00H00",
    verses: [
      "Vers le milieu de la nuit, Paul et Silas priaient et chantaient les louanges de Dieu. — Actes 16:25",
      "Celui qui demeure sous l'abri du Très-Haut repose à l'ombre du Tout Puissant. — Psaume 91:1"
    ],
    caption: "🌌 **NOTIFICATION OFFICIELLE DE PRIÈRE (00H00)**\n\nHeure d'intercession et de combat spirituel ! Brisez les chaînes par la prière."
  }
};

// 🎨 GÉNÉRATEUR CANVAS HAUTEMENT DÉCORÉ
async function generatePrayerCanvas(title, hourText, verseText) {
  const width = 1000;
  const height = 550;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Fond Dégradé
  const bg = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 600);
  bg.addColorStop(0, "#1e1b4b");
  bg.addColorStop(0.5, "#0f172a");
  bg.addColorStop(1, "#030712");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Halo Lumineux Central
  const glow = ctx.createRadialGradient(width / 2, 90, 5, width / 2, 90, 150);
  glow.addColorStop(0, "rgba(251, 191, 36, 0.35)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(width / 2, 90, 150, 0, Math.PI * 2);
  ctx.fill();

  // Cadres Dorés
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(26, 26, width - 52, height - 52);

  // Coins Ornementaux
  const drawCorner = (x, y, rotation) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(0, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
    ctx.restore();
  };
  drawCorner(35, 35, 0);
  drawCorner(width - 35, 35, Math.PI / 2);
  drawCorner(width - 35, height - 35, Math.PI);
  drawCorner(35, height - 35, -Math.PI / 2);

  // Étoiles
  ctx.fillStyle = "#fef08a";
  const stars = [
    { x: 100, y: 80 }, { x: 900, y: 80 },
    { x: 120, y: 460 }, { x: 880, y: 460 },
    { x: 50, y: 270 }, { x: 950, y: 270 }
  ];
  stars.forEach(s => {
    ctx.font = "16px sans-serif";
    ctx.fillText("✦", s.x, s.y);
  });

  // Croix
  ctx.shadowColor = "#fbbf24";
  ctx.shadowBlur = 15;
  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 50px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✝️", width / 2, 85);
  ctx.shadowBlur = 0;

  // Titre
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px sans-serif";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 8;
  ctx.fillText(title, width / 2, 142);

  // Badge Heure
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 20px monospace";
  ctx.fillText(`✨ NOTIFICATION OFFICIELLE | ${hourText} ✨`, width / 2, 182);
  ctx.shadowBlur = 0;

  // Ligne Séparatrice
  const lineGrad = ctx.createLinearGradient(150, 0, 850, 0);
  lineGrad.addColorStop(0, "transparent");
  lineGrad.addColorStop(0.5, "#fbbf24");
  lineGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(150, 210);
  ctx.lineTo(850, 210);
  ctx.stroke();

  // Verset / Proverbe
  ctx.fillStyle = "#f8fafc";
  ctx.font = "italic 23px sans-serif";
  const words = verseText.split(" ");
  let line = "";
  let startY = 270;

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + " ";
    if (ctx.measureText(testLine).width > 760 && n > 0) {
      ctx.fillText(line, width / 2, startY);
      line = words[n] + " ";
      startY += 38;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, width / 2, startY);

  // Pied de Page
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 15px monospace";
  ctx.fillText("🇨🇩 SYSTEM NOTIFICATION | PRIÈRE & SPIRITUALITÉ", width / 2, height - 35);

  const imgPath = path.join(__dirname, `prayer_card_${Date.now()}.png`);
  await fs.writeFile(imgPath, canvas.toBuffer("image/png"));
  return imgPath;
}

// Broadcast complet avec boucle progressive anti-spam
async function broadcastToAllThreads(api, prayerData) {
  if (!getGlobalStatus()) {
    console.log("[PRIERE] ⚠️ Diffusion annulée : Notification globale désactivée.");
    return;
  }

  let imgPath = null;
  try {
    const randomVerse = prayerData.verses[Math.floor(Math.random() * prayerData.verses.length)];
    imgPath = await generatePrayerCanvas(prayerData.title, prayerData.hour, randomVerse);

    const threads = await api.getThreadList(500, null, ["INBOX"]);
    const groups = threads.filter(t => t.isGroup);

    console.log(`[PRIERE] 📢 Début d'envoi dans ${groups.length} groupe(s)...`);

    for (const group of groups) {
      try {
        const messagePayload = {
          body: `➴➵➶➴➵➶➴➵➶➴➵➶➴➵➶\n🔔 **NOTIFICATION DE PRIÈRE CHRÉTIENNE** 🙏\n\n${prayerData.caption}\n\n📖 *« ${randomVerse} »*\n\n💬 *C'est l'heure de prier ! Que la paix du Seigneur remplisse vos cœurs !*\n➴➵➶➴➵➶➴➵➶➴➵➶➴➵➶`,
          attachment: fs.createReadStream(imgPath)
        };
        await api.sendMessage(messagePayload, group.threadID);
        console.log(`[PRIERE] ✅ Envoyé avec succès au groupe : ${group.name || group.threadID}`);
      } catch (e) {
        console.error(`[PRIERE] ❌ Erreur d'envoi au groupe ${group.threadID}:`, e.message);
      }
      // Pause de 1.2 sec entre chaque groupe pour contourner la sécurité Messenger
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    console.log("[PRIERE] 🎉 Diffusion globale terminée !");

  } catch (err) {
    console.error("[PRIERE] Erreur broadcast:", err.message);
  } finally {
    if (imgPath && fs.existsSync(imgPath)) {
      setTimeout(() => {
        try { fs.unlinkSync(imgPath); } catch {}
      }, 15000);
    }
  }
}

module.exports = {
  config: {
    name: "priere",
    aliases: ["prayer", "verset"],
    version: "4.1.1",
    author: "Système 🇨🇩",
    category: "religion",
    description: "Notification globale de prière avec Canvas décoré et diffusion progressive."
  },

  onLoad: async function ({ api }) {
    console.log("[PRIERE] 📜 Service Canvas Ultra-Décoré + Diffusion Progressive Activé !");

    cron.schedule("0 0,6,12,18 * * *", async () => {
      const h = new Date().getHours().toString().padStart(2, "0") + ":00";
      if (PRAYERS_DATA[h]) await broadcastToAllThreads(api, PRAYERS_DATA[h]);
    }, { scheduled: true, timezone: "Africa/Kinshasa" });

    cron.schedule("25 20 * * *", async () => {
      await broadcastToAllThreads(api, PRAYERS_DATA["20:25"]);
    }, { scheduled: true, timezone: "Africa/Kinshasa" });

    cron.schedule("35 20 * * *", async () => {
      await broadcastToAllThreads(api, PRAYERS_DATA["20:35"]);
    }, { scheduled: true, timezone: "Africa/Kinshasa" });
  },

  onStart: async function ({ api, event, message, args, role }) {
    const subCommand = args[0] ? args[0].toLowerCase() : "";

    if (subCommand === "on") {
      if (role < 2) return message.reply("⚠️ Seul l'Admin du bot peut activer les notifications globales.");
      setGlobalStatus(true);
      return message.reply("➴➵➶➴➵➶➴➵➶➴➵➶➴➵➶\n✅ **NOTIFICATION GLOBALE ACTIVÉE !**\nLes rappels seront envoyés à **06h, 12h, 18h, 20h25, 20h35 et 00h** dans TOUS les groupes.\n➴➵➶➴➵➶➴➵➶➴➵➶➴➵➶");
    }

    if (subCommand === "off") {
      if (role < 2) return message.reply("⚠️ Seul l'Admin du bot peut désactiver les notifications globales.");
      setGlobalStatus(false);
      return message.reply("➴➵➶➴➵➶➴➵➶➴➵➶➴➵➶\n🛑 **NOTIFICATION GLOBALE DÉSACTIVÉE !**\n➴➵➶➴➵➶➴➵➶➴➵➶➴➵➶");
    }

    if (subCommand === "broadcast" || subCommand === "test") {
      if (role < 2) return message.reply("⚠️ Seul l'Admin du bot peut lancer un broadcast.");
      message.reply("⏳ Lancement de la diffusion de test dans tous les groupes...");
      await broadcastToAllThreads(api, PRAYERS_DATA["20:35"]);
      return;
    }

    const pData = PRAYERS_DATA["20:35"];
    const randomVerse = pData.verses[Math.floor(Math.random() * pData.verses.length)];
    const imgPath = await generatePrayerCanvas(pData.title, pData.hour, randomVerse);

    await message.reply({
      body: `➴➵➶➴➵➶➴➵➶➴➵➶➴➵➶\n🔔 **RAPPEL DE PRIÈRE CHRÉTIENNE** 🙏\n\n${pData.caption}\n\n📖 *« ${randomVerse} »*\n➴➵➶➴➵➶➴➵➶➴➵➶➴➵➶`,
      attachment: fs.createReadStream(imgPath)
    });

    setTimeout(() => {
      try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch {}
    }, 5000);
  }
};
