const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "fzi",
    version: "1.1.0",
    author: "FZI Génie",
    countDown: 5,
    role: 0,
    shortDescription: "Affiche l'uptime et le statut de FZI en Canvas ultra cool",
    longDescription: "Génère une image personnalisée et stylisée avec la photo de l'utilisateur et le temps de fonctionnement du bot FZI.",
    category: "info",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, message }) {
    const { senderID } = event;

    // 1. Calcul de l'Uptime (Temps de fonctionnement)
    const time = process.uptime();
    const days = Math.floor(time / (24 * 60 * 60));
    const hours = Math.floor((time % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((time % (60 * 60)) / 60);
    const seconds = Math.floor(time % 60);
    
    let uptimeString = "";
    if (days > 0) uptimeString += `${days}j `;
    uptimeString += `${hours}h ${minutes}m ${seconds}s`;

    // 2. Message d'attente
    const waitMsg = await message.reply("🔮 **FZI** invoque la puissance du génie pour ton image...");

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const userAvatarPath = path.join(cacheDir, `avatar_${senderID}.png`);
    const outputPath = path.join(cacheDir, `fzi_cool_uptime_${senderID}.png`);

    try {
      // 3. Récupérer l'avatar de l'utilisateur (haute qualité)
      const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const res = await axios.get(avatarUrl, { responseType: "arraybuffer" });
      await fs.writeFile(userAvatarPath, Buffer.from(res.data, "utf-8"));

      // 4. Configuration du Canvas (16:9 cinématographique)
      const width = 1280;
      const height = 720;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // --- A. FOND PREMIUM ---
      // Dégradé radial sombre et mystérieux
      const gradientBg = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, width);
      gradientBg.addColorStop(0, "#1a1a2e"); // Centre un peu plus clair
      gradientBg.addColorStop(1, "#0a0a12"); // Bords très sombres
      ctx.fillStyle = gradientBg;
      ctx.fillRect(0, 0, width, height);

      // --- B. EFFET DE PARTICULES DE FOND (LOOK "GÉNIE") ---
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 3;
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- C. CADRE NÉON SUBTIL ---
      const gradientBorder = ctx.createLinearGradient(0, 0, width, height);
      gradientBorder.addColorStop(0, "#00f2fe");
      gradientBorder.addColorStop(1, "#4facfe");
      ctx.lineWidth = 15;
      ctx.strokeStyle = gradientBorder;
      ctx.globalAlpha = 0.2; // Très transparent
      ctx.strokeRect(15, 15, width - 30, height - 30);
      ctx.globalAlpha = 1.0; // Reset transparence

      // --- D. PHOTO DE PROFIL STYLISÉE (Génial) ---
      const avatar = await loadImage(userAvatarPath);
      const avatarSize = 280;
      const avatarX = 150;
      const avatarY = height / 2 - avatarSize / 2;

      // Effet d'ombre portée sur le cercle
      ctx.shadowColor = "rgba(0, 242, 254, 0.8)";
      ctx.shadowBlur = 40;

      // Double cercle néon autour de l'avatar
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 15, 0, Math.PI * 2);
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#4facfe"; // Violet néon
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#00f2fe"; // Cyan néon
      ctx.stroke();
      
      ctx.shadowBlur = 0; // Reset ombre pour l'image

      // Masque circulaire pour l'image
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // --- E. ZONE TEXTE (Futuriste) ---
      const textX = 550; // Position X de début du texte

      // Ombre sur le texte pour le style
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      // 1. Titre Principal "FZI" avec dégradé néon
      ctx.textAlign = "left";
      const gradientFzi = ctx.createLinearGradient(textX, 0, textX + 200, 0);
      gradientFzi.addColorStop(0, "#00f2fe"); // Cyan
      gradientFzi.addColorStop(1, "#4facfe"); // Violet clair
      ctx.fillStyle = gradientFzi;
      ctx.font = "bold 130px Arial";
      ctx.fillText("FZI", textX, 250);

      // 2. Sous-titre "Génie dernière génération"
      ctx.fillStyle = "#ffffff";
      ctx.font = "italic 38px Arial";
      ctx.fillText("Génie dernière génération", textX, 310);

      // Ligne de décoration
      ctx.beginPath();
      ctx.moveTo(textX, 340);
      ctx.lineTo(textX + 500, 340);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.stroke();

      // 3. Bloc Uptime
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#4facfe";
      ctx.fillStyle = "#4facfe";
      ctx.font = "bold 32px Arial";
      ctx.fillText("⏱️ TEMPS D'ACTIVITÉ (UPTIME)", textX, 400);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 70px Arial";
      ctx.fillText(uptimeString, textX, 480);

      ctx.shadowBlur = 0; // Reset ombre

      // 5. Enregistrement de l'image
      const buffer = canvas.toBuffer("image/png");
      await fs.writeFile(outputPath, buffer);

      // 6. Suppression du message d'attente et envoi de l'image
      if (waitMsg && waitMsg.messageID) {
        api.unsendMessage(waitMsg.messageID);
      }

      await message.reply({
        body: `✨ **FZI - RAPPORT DE PUISSANCE** ✨\n\nLe génie est opérationnel depuis : **${uptimeString}**.\n*Toujours prêt, jamais égalé.*`,
        attachment: fs.createReadStream(outputPath)
      });

      // 7. Nettoyage des fichiers temporaires
      setTimeout(() => {
        fs.unlinkSync(userAvatarPath);
        fs.unlinkSync(outputPath);
      }, 5000);

    } catch (error) {
      console.error("[FZI CMD] Erreur :", error);
      if (waitMsg && waitMsg.messageID) {
        api.unsendMessage(waitMsg.messageID);
      }
      return message.reply("⚠️ Le génie FZI a rencontré une perturbation lors de la création de l'image.");
    }
  }
};
