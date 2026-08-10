const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const axios = require("axios");

const deltaNext = 5;

// Convertir l'EXP en niveau
function expToLevel(exp) {
  return Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);
}

// Formater l'argent
function formatMoney(value) {
  if (value >= 1e15) return (value / 1e15).toFixed(2) + " Qt";
  if (value >= 1e12) return (value / 1e12).toFixed(2) + " T";
  if (value >= 1e9) return (value / 1e9).toFixed(2) + " B";
  if (value >= 1e6) return (value / 1e6).toFixed(2) + " M";
  if (value >= 1e3) return (value / 1e3).toFixed(2) + " k";
  return value.toString();
}

// Cache des avatars
const avatarCache = new Map();

// Récupération sécurisée des avatars via Buffer
async function fetchAvatarSafe(userID, usersData) {
  if (avatarCache.has(userID)) return avatarCache.get(userID);

  try {
    let avatarURL = await usersData.getAvatarUrl?.(userID);
    if (!avatarURL) {
      avatarURL = `https://graph.facebook.com/${userID}/picture?type=large&width=500&height=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    }
    avatarURL += avatarURL.includes("?") ? "&" : "?";
    avatarURL += `t=${Date.now()}`;

    const res = await axios.get(avatarURL, { responseType: "arraybuffer", timeout: 8000 });
    const img = await loadImage(Buffer.from(res.data));
    avatarCache.set(userID, img);
    return img;
  } catch (e) {
    const size = 100;
    const fallback = createCanvas(size, size);
    const ctx = fallback.getContext("2d");
    ctx.fillStyle = "#3b0066";
    ctx.fillRect(0, 0, size, size);
    ctx.font = `bold ${size / 2}px sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(userID.charAt(0).toUpperCase(), size / 2, size / 2);
    avatarCache.set(userID, fallback);
    return fallback;
  }
}

// Rectangle arrondi
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  return ctx;
}

// Variable globale pour le wallpaper
let wallpaper = null;

// Dessiner le tableau des tops
async function drawTopBoard(users, type, usersData) {
  const W = 1200, H = 1000;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Fond : wallpaper ou gradient moderne
  if (wallpaper && fs.existsSync(wallpaper)) {
    const bgImg = await loadImage(wallpaper);
    ctx.drawImage(bgImg, 0, 0, W, H);
    ctx.fillStyle = "rgba(10, 10, 25, 0.75)";
    ctx.fillRect(0, 0, W, H);
  } else {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#060814");
    bg.addColorStop(0.5, "#11092c");
    bg.addColorStop(1, "#050211");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }

  // Grille holographique
  ctx.strokeStyle = "rgba(0, 255, 234, 0.03)";
  ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 50) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
  }
  for (let j = 0; j < H; j += 50) {
    ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(W, j); ctx.stroke();
  }

  // En-tête / Titre
  ctx.save();
  ctx.shadowColor = type === "rank" ? "#ff007f" : "#00f0ff";
  ctx.shadowBlur = 30;
  ctx.font = "bold 52px sans-serif";
  ctx.fillStyle = type === "rank" ? "#ff007f" : "#00f0ff";
  ctx.textAlign = "center";
  ctx.fillText(type === "rank" ? "🏆 LEADERBOARD CLASSEMENT" : "💰 CLASSEMENT FORTUNES", W / 2, 90);
  ctx.restore();

  // Barre sous le titre
  const titleGrad = ctx.createLinearGradient(W/2 - 200, 0, W/2 + 200, 0);
  titleGrad.addColorStop(0, "rgba(0, 240, 255, 0)");
  titleGrad.addColorStop(0.5, type === "rank" ? "#ff007f" : "#00f0ff");
  titleGrad.addColorStop(1, "rgba(0, 240, 255, 0)");
  ctx.fillStyle = titleGrad;
  ctx.fillRect(W/2 - 250, 110, 500, 3);

  // Top 3 Podium
  const positions = [
    { i: 0, x: W / 2 - 95, y: 155, size: 190, color: "#FFD700", rankText: "👑 1er", glow: "#FFD700" },
    { i: 1, x: W / 2 - 320, y: 205, size: 150, color: "#C0C0C0", rankText: "🥈 2e", glow: "#00bfff" },
    { i: 2, x: W / 2 + 170, y: 205, size: 150, color: "#CD7F32", rankText: "🥉 3e", glow: "#ff4500" },
  ];

  for (const pos of positions) {
    const u = users[pos.i]; if (!u) continue;
    let avatar = await fetchAvatarSafe(u.userID, usersData).catch(() => createCanvas(pos.size, pos.size));
    
    ctx.save();
    ctx.shadowColor = pos.glow;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(pos.x + pos.size / 2, pos.y + pos.size / 2, pos.size / 2 + 8, 0, Math.PI * 2);
    ctx.strokeStyle = pos.color;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x + pos.size / 2, pos.y + pos.size / 2, pos.size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, pos.x, pos.y, pos.size, pos.size);
    ctx.restore();

    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    roundRect(ctx, pos.x - 20, pos.y + pos.size + 15, pos.size + 40, 100, 12).fill();

    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    const displayName = u.name ? (u.name.length > 13 ? u.name.slice(0, 11) + "…" : u.name) : "Inconnu";
    ctx.fillText(displayName, pos.x + pos.size / 2, pos.y + pos.size + 45);

    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = pos.color;
    ctx.fillText(pos.rankText, pos.x + pos.size / 2, pos.y + pos.size + 73);

    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = "#00ffb7";
    const value = type === "rank" ? `Nv ${expToLevel(Number(u.totalExp || 0))}` : `${formatMoney(Number(u.money || 0))} 💵`;
    ctx.fillText(value, pos.x + pos.size / 2, pos.y + pos.size + 100);
  }

  // Places 4 à 10
  const startY = 490;
  const rowH = 65;
  const avatarSize = 48;

  for (let i = 3; i < users.length; i++) {
    const u = users[i];
    const y = startY + (i - 3) * rowH;

    const cardGrad = ctx.createLinearGradient(100, y - 30, W - 100, y - 30);
    cardGrad.addColorStop(0, "rgba(20, 20, 45, 0.75)");
    cardGrad.addColorStop(1, "rgba(5, 5, 15, 0.4)");
    ctx.fillStyle = cardGrad;
    roundRect(ctx, 80, y - 28, W - 160, rowH - 12, 10).fill();

    ctx.fillStyle = type === "rank" ? "#ff007f" : "#00f0ff";
    roundRect(ctx, 80, y - 28, 6, rowH - 12, 2).fill();

    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.textAlign = "left";
    ctx.fillText(`#${i + 1}`, 110, y + 12);

    let avatar = await fetchAvatarSafe(u.userID, usersData).catch(() => createCanvas(avatarSize, avatarSize));
    ctx.save();
    ctx.beginPath();
    ctx.arc(200 + avatarSize / 2, y - 18 + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, 200, y - 18, avatarSize, avatarSize);
    ctx.restore();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(200 + avatarSize / 2, y - 18 + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    const nameLimit = u.name ? (u.name.length > 22 ? u.name.slice(0, 20) + "…" : u.name) : "Inconnu";
    ctx.fillText(nameLimit, 275, y + 12);

    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#00ffb7";
    ctx.textAlign = "right";
    const value = type === "rank" ? `Nv ${expToLevel(Number(u.totalExp || 0))} (${u.totalExp || 0} XP)` : `${formatMoney(Number(u.money || 0))} 💵`;
    ctx.fillText(value, W - 120, y + 12);
  }

  ctx.font = "16px sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.textAlign = "center";
  ctx.fillText(`🕓 Généré le: ${moment().tz("Africa/Abidjan").format("YYYY-MM-DD à HH:mm:ss")}`, W / 2, H - 25);

  const fileName = `top_${type}_${Date.now()}.png`;
  const filePath = path.join(__dirname, "cache", fileName);
  await fs.ensureDir(path.dirname(filePath));
  await fs.outputFile(filePath, canvas.toBuffer("image/png"));
  return filePath;
}

// Export du module
module.exports = {
  config: {
    name: "top",
    version: "3.4",
    author: "Christus x Célestin",
    countDown: 10,
    role: 0,
    usePrefix: false, // MODE SANS PRÉFIXE ACTIVÉ
    shortDescription: "Afficher le top 10 Classement/Argent avec wallpaper",
    category: "rank",
    guide: {
      fr: "{pn} rank | money | setwall"
    }
  },

  onStart: async function({ api, event, args, usersData, message }) {
    try {
      // --- Handle setwall ---
      if (args[0] && args[0].toLowerCase() === "setwall") {
        const messageReply = event.messageReply;
        const senderID = event.senderID;
        if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0)
          return message.reply("❌ Vous devez répondre à une image pour définir le wallpaper.");
        const imageUrl = messageReply.attachments[0].url;
        try {
          const cacheDir = path.join(__dirname, "cache"); 
          await fs.ensureDir(cacheDir);
          const wallPath = path.join(cacheDir, `wallpaper_${senderID}.jpg`);
          const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          await fs.outputFile(wallPath, Buffer.from(response.data));
          wallpaper = wallPath;
          return message.reply("✅ Arrière-plan personnalisé défini avec succès !");
        } catch (err) { 
          console.error(err); 
          return message.reply("❌ Impossible de définir l'arrière-plan."); 
        }
      }

      // --- Handle rank/money ---
      const type = args[0]?.toLowerCase();
      if (!["rank", "money"].includes(type)) return message.reply("⚠️ Utilisation : top rank ou top money");

      const allUsers = await usersData.getAll();
      let sorted = type === "rank" ?
        allUsers.map(u => ({ ...u, totalExp: Number(u.exp || 0) })).sort((a, b) => b.totalExp - a.totalExp).slice(0, 10) :
        allUsers.map(u => ({ ...u, money: Number(u.money || 0) })).sort((a, b) => b.money - a.money).slice(0, 10);

      const filePath = await drawTopBoard(sorted, type, usersData);

      let body = `📊 Top 10 ${type === "rank" ? "Classement" : "Argent"}\n\n`;
      for (let i = 0; i < sorted.length; i++) {
        const u = sorted[i];
        const value = type === "rank" ? `Nv ${expToLevel(Number(u.totalExp || 0))} (${u.totalExp || 0})` : `${formatMoney(Number(u.money || 0))} 💵`;
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
        body += `${medal} ${u.name || "Inconnu"} — ${value}\n`;
      }

      return message.reply({ 
        body, 
        attachment: fs.createReadStream(filePath) 
      }, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    } catch (err) { 
      console.error(err); 
      return message.reply("❌ Une erreur est survenue lors de la génération du classement."); 
    }
  }
};
