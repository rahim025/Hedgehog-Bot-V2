const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

module.exports = {
  config: {
    name: "leave",
    version: "3.5.0",
    author: "NTKhang x Célestin 🔥 (Canvas Edition)",
    category: "events"
  },

  langs: {
    fr: {
      session1: "matin",
      session2: "midi",
      session3: "après-midi",
      session4: "soir",
      leaveType1: "a quitté",
      leaveType2: "a été expulsé",
      defaultLeaveMessage: "{userName} a quitté le groupe"
    }
  },

  onStart: async ({ threadsData, message, event, api, usersData }) => {
    if (event.logMessageType !== "log:unsubscribe") return;

    return async function () {
      const { threadID } = event;
      
      let threadData = {};
      try {
        threadData = await threadsData.get(threadID);
      } catch (e) {}

      // Vérification des paramètres si activés dans la DB
      if (threadData.settings && threadData.settings.sendLeaveMessage === false) return;

      const { leftParticipantFbId } = event.logMessageData;
      if (leftParticipantFbId == api.getCurrentUserID()) return;

      let userName = "Un membre";
      try {
        userName = await usersData.getName(leftParticipantFbId);
      } catch (e) {
        try {
          const uInfo = await api.getUserInfo(leftParticipantFbId);
          if (uInfo && uInfo[leftParticipantFbId]) {
            userName = uInfo[leftParticipantFbId].name || userName;
          }
        } catch (err) {}
      }

      let memberCount = 0;
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        memberCount = threadInfo.participantIDs ? threadInfo.participantIDs.length : 0;
      } catch (e) {}

      const isKicked = event.author && event.author != leftParticipantFbId;

      // Définition des sessions horaires
      const hour = new Date().getHours();
      let timeText = "🌙 𝑵𝒖𝒊𝒕 𝒔𝒐𝒎𝒃𝒓𝒆...";
      if (hour >= 5 && hour < 12) timeText = "🌅 𝑴𝒂𝒕𝒊𝒏 𝒄𝒂𝒍𝒎𝒆...";
      else if (hour >= 12 && hour < 17) timeText = "☀️ 𝑷𝒍𝒆𝒊𝒏 𝒋𝒐𝒖𝒓...";
      else if (hour >= 17 && hour < 22) timeText = "🌆 𝑺𝒐𝒊𝒓𝒆́𝒆 𝒂𝒄𝒕𝒊𝒗𝒆...";

      // Liste des messages de secours
      const leaveMsgs = [
        `✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n\n${timeText}\n\n💨 𝑳𝒆 𝒎𝒆𝒎𝒃𝒓𝒆 ${userName} 𝒂 𝒒𝒖𝒊𝒕𝒕𝒆́...\n💅 𝑳𝒆 𝒔𝒕𝒚𝒍𝒆 𝒓𝒆𝒔𝒕𝒆.\n\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧`,
        `✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n\n${timeText}\n\n👀 ${userName} 𝒆𝒔𝒕 𝒑𝒂𝒓𝒕𝒊.\n🔥 𝑹𝒊𝒆𝒏 𝒏𝒆 𝒄𝒉𝒂𝒏𝒈𝒆.\n\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧`,
        `✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n\n${timeText}\n\n🫠 ${userName} 𝒂 𝒅𝒊𝒔𝒑𝒂𝒓𝒖...\n👑 𝑳’𝒆́𝒍𝒊𝒕𝒆 𝒄𝒐𝒏𝒕𝒊𝒏𝒖𝒆.\n\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧`
      ];

      const kickMsgs = [
        `✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n\n${timeText}\n\n💀 ${userName} 𝒂 𝒆́𝒕𝒆́ 𝒆𝒙𝒑𝒖𝒍𝒔𝒆́.\n⚠️ 𝑵𝒊𝒗𝒆𝒂𝒖 𝒊𝒏𝒔𝒖𝒇𝒇𝒊𝒔𝒂𝒏𝒕.\n\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧`,
        `✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n\n${timeText}\n\n🚫 ${userName} 𝒂 𝒆́𝒕𝒆́ 𝒔𝒖𝒑𝒑𝒓𝒊𝒎𝒆́.\n👑 𝑺𝒆́𝒍𝒆𝒄𝒕𝒊𝒐𝒏 𝒏𝒂𝒕𝒖𝒓𝒆𝒍𝒍𝒆.\n\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧`,
        `✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n\n${timeText}\n\n⚡ ${userName} 𝒂 𝒆́𝒕𝒆́ 𝒆́𝒋𝒆𝒄𝒕𝒆́.\n🔥 𝑳𝒆 𝒈𝒓𝒐𝒖𝒑𝒆 𝒓𝒆𝒔𝒑𝒊𝒓𝒆 𝒎𝒊𝒆𝒖𝒙.\n\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧`
      ];

      const messages = isKicked ? kickMsgs : leaveMsgs;
      const bodyText = messages[Math.floor(Math.random() * messages.length)];

      // ==========================================
      // 🎨 GENERATION DU CANVAS LEAVE
      // ==========================================
      const width = 900;
      const height = 450;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      const primaryColor = '#e94560';

      // 1. Fond dégradé
      let gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#120714');
      gradient.addColorStop(0.5, '#1a0b1e');
      gradient.addColorStop(1, '#120714');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Halos lumineux
      ctx.fillStyle = 'rgba(233, 69, 96, 0.05)';
      ctx.beginPath(); ctx.arc(150, 225, 180, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(700, 200, 220, 0, Math.PI * 2); ctx.fill();

      // 3. Cadres
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 4;
      drawRoundedRect(ctx, 25, 25, 850, 400, 12);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, 32, 32, 836, 386, 8);
      ctx.stroke();

      // 4. Décorations
      ctx.fillStyle = primaryColor;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 400, 65);
      ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 400, 395);

      // 5. Avatar
      const avatarX = 190;
      const avatarY = 225;
      const avatarRadius = 110;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      const avatarUrl = `https://graph.facebook.com/${leftParticipantFbId}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      let imgLoaded = false;

      try {
        const res = await axios.get(avatarUrl, { responseType: 'arraybuffer', timeout: 3000 });
        const userAvatar = await loadImage(Buffer.from(res.data));
        ctx.drawImage(userAvatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        imgLoaded = true;
      } catch (e) {}

      if (!imgLoaded) {
        ctx.fillStyle = '#2a1122';
        ctx.fillRect(avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 60px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(userName.charAt(0).toUpperCase() || '👤', avatarX, avatarY + 20);
      }
      ctx.restore();

      // Contour Néon
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius + 2, 0, Math.PI * 2);
      ctx.stroke();

      // 6. Textes principaux
      ctx.textAlign = 'left';
      ctx.fillStyle = primaryColor;
      ctx.font = 'bold 38px sans-serif';
      ctx.fillText(isKicked ? "🚫 EXPULSION !" : "🚪 DÉPART...", 400, 130);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`👤 Membre : ${truncateText(ctx, userName, 420)}`, 400, 195);

      ctx.fillStyle = '#AAAAAA';
      ctx.font = '20px sans-serif';
      ctx.fillText(isKicked ? "⚠️ Raison : Sélection naturelle / Kick admin" : "💨 Raison : A quitté de son plein gré", 400, 250);

      ctx.fillStyle = primaryColor;
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`👥 Membres restants : ${memberCount}`, 400, 310);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'italic 16px sans-serif';
      ctx.fillText(timeText, 400, 355);

      // Envoi
      const tmpDir = path.join(__dirname, "cache");
      await fs.ensureDir(tmpDir);
      const imagePath = path.join(tmpDir, `leave_${leftParticipantFbId}_${Date.now()}.png`);
      await fs.outputFile(imagePath, canvas.toBuffer('image/png'));

      return message.send({
        body: bodyText,
        attachment: fs.createReadStream(imagePath)
      }, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      });
    };
  }
};

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
