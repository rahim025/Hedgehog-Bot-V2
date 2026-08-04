const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

module.exports = {
  config: {
    name: "welcome",
    version: "3.5.0",
    author: "Saimx69x + Celestin 😎 (Canvas Remake)",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    const { threadID, logMessageType, logMessageData } = event;
    const botID = api.getCurrentUserID();

    if (logMessageType !== "log:subscribe" && logMessageType !== "log:unsubscribe") return;

    let groupName = "Ce groupe";
    let memberCount = 0;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      groupName = threadInfo.threadName || "Ce groupe";
      memberCount = threadInfo.participantIDs ? threadInfo.participantIDs.length : 0;
    } catch (e) {}

    const tmp = path.join(__dirname, "cache");
    await fs.ensureDir(tmp);

    // ==========================================
    // 🎨 GÉNÉRATEUR CANVAS HAUTE DÉFINITION
    // ==========================================
    async function generateCanvas(userId, fullName, type) {
      const width = 900;
      const height = 450;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      const isWelcome = type === "welcome";
      const primaryColor = isWelcome ? '#00b4d8' : '#e94560';
      const secondaryColor = isWelcome ? '#90e0ef' : '#ff758f';

      // 1. Fond sombre futuriste
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0a0c16');
      bgGrad.addColorStop(0.5, '#121629');
      bgGrad.addColorStop(1, '#0a0c16');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Halo lumineux en arrière-plan
      const glowGrad = ctx.createRadialGradient(200, 225, 20, 200, 225, 250);
      glowGrad.addColorStop(0, isWelcome ? 'rgba(0, 180, 216, 0.25)' : 'rgba(233, 69, 96, 0.25)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Cadre double stylisé
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 3;
      drawRoundedRect(ctx, 20, 20, width - 40, height - 40, 15);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, 28, 28, width - 56, height - 56, 12);
      ctx.stroke();

      // Motifs décoratifs supérieurs & inférieurs
      ctx.fillStyle = primaryColor;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 410, 60);
      ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 410, 395);

      // 4. Intégration de l'Avatar
      const avatarX = 200;
      const avatarY = 225;
      const avatarRadius = 100;

      // Cercle d'arrière-plan de l'avatar
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius + 6, 0, Math.PI * 2);
      ctx.fillStyle = primaryColor;
      ctx.fill();

      // Découpe et chargement de la photo
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
      ctx.clip();

      const avatarUrl = `https://graph.facebook.com/${userId}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      let imgLoaded = false;

      try {
        const res = await axios.get(avatarUrl, { responseType: 'arraybuffer', timeout: 3000 });
        const img = await loadImage(Buffer.from(res.data));
        ctx.drawImage(img, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        imgLoaded = true;
      } catch (e) {}

      if (!imgLoaded) {
        ctx.fillStyle = '#1c2237';
        ctx.fillRect(avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 60px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(fullName.charAt(0).toUpperCase() || '👤', avatarX, avatarY + 20);
      }
      ctx.restore();

      // Contour externe brillant
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius + 2, 0, Math.PI * 2);
      ctx.stroke();

      // 5. Textes et Infos
      ctx.textAlign = 'left';

      if (isWelcome) {
        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 38px sans-serif';
        ctx.fillText("🎉 BIENVENUE !", 410, 120);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`👤 Utilisateur : ${truncateText(ctx, fullName, 420)}`, 410, 180);

        ctx.fillStyle = '#B0B8C4';
        ctx.font = '20px sans-serif';
        ctx.fillText(`📌 Groupe : ${truncateText(ctx, groupName, 420)}`, 410, 235);

        ctx.fillStyle = secondaryColor;
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`👥 Membre n° : ${memberCount}`, 410, 290);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = 'italic 17px sans-serif';
        ctx.fillText("🤝 Amuse-toi bien avec nous !", 410, 340);
      } else {
        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 38px sans-serif';
        ctx.fillText("🚀 AU REVOIR !", 410, 125);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`👤 ${truncateText(ctx, fullName, 420)}`, 410, 185);

        ctx.fillStyle = '#B0B8C4';
        ctx.font = '20px sans-serif';
        ctx.fillText("🚪 A quitté le groupe...", 410, 240);

        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`👥 Membres restants : ${memberCount}`, 410, 295);
      }

      const imagePath = path.join(tmp, `${type}_${userId}_${Date.now()}.png`);
      await fs.outputFile(imagePath, canvas.toBuffer('image/png'));
      return imagePath;
    }

    // ==========================================
    // 1️⃣ REJOINTE (SUBSCRIBE)
    // ==========================================
    if (logMessageType === "log:subscribe") {
      const newUsers = logMessageData.addedParticipants || [];

      if (newUsers.some(u => u.userFbId === botID)) {
        let botName = "BOT";
        if (global.GoatBot && global.GoatBot.config && global.GoatBot.config.nickNameBot) {
          botName = global.GoatBot.config.nickNameBot;
        }
        try {
          await api.changeNickname(`✧ ${botName} ✧`, threadID, botID);
        } catch (e) {}

        return api.sendMessage(
          `✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n🤖 BOT CONNECTÉ\n\n👋 Salut ! Je viens d'être ajouté.\n💡 Tape "help" pour voir mes commandes.\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧`,
          threadID
        );
      }

      for (const user of newUsers) {
        try {
          const imagePath = await generateCanvas(user.userFbId, user.fullName, "welcome");

          await api.sendMessage({
            body: `✧ ▬▭▬ ▬▬ ✦✧✦ ▬▬ ▬▬ ✧\n🎉 Bienvenue à toi ${user.fullName} !\nRegarde ton badge ci-dessous.\n✧ ▬▭▬ ▭▬ ✦✧✦ ▬▭ ▬▭▬ ✧`,
            attachment: fs.createReadStream(imagePath),
            mentions: [{ tag: user.fullName, id: user.userFbId }]
          }, threadID, () => {
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
          });
        } catch (err) {
          console.error("🔹 [Erreur Welcome Canvas]", err);
        }
      }
    }

    // ==========================================
    // 2️⃣ DÉPART (UNSUBSCRIBE)
    // ==========================================
    if (logMessageType === "log:unsubscribe") {
      const leftUser = logMessageData.leftParticipantFbId;
      if (leftUser === botID) return;

      try {
        let fullName = "Un membre";
        try {
          const userInfo = await api.getUserInfo(leftUser);
          if (userInfo && userInfo[leftUser]) {
            fullName = userInfo[leftUser].name || fullName;
          }
        } catch (e) {}

        const imagePath = await generateCanvas(leftUser, fullName, "leave");

        await api.sendMessage({
          body: `✧ ▬▭▬ ▬▬ ✦✧✦ ▬▬ ▬▬ ✧\n🚪 ${fullName} a quitté le groupe.\nBonne chance à lui/elle !\n✧ ▬▭▬ ▭▬ ✦✧✦ ▬▭ ▬▭▬ ✧`,
          attachment: fs.createReadStream(imagePath)
        }, threadID, () => {
          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        });
      } catch (err) {
        console.error("🔹 [Erreur Leave Canvas]", err);
      }
    }
  }
};

// Fonctions utilitaires
function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  while (ctx.measureText(text + '...').width > maxWidth && text.length > 0) {
    text = text.slice(0, -1);
  }
  return text + '...';
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  }
  
