const { createCanvas, loadImage } = require("@napi-rs/canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "bal",
    aliases: ["bal", "$", "cash", "solde"],
    version: "7.1 (PNG Static Edition)",
    author: "Christus x Célestin 🔥",
    countDown: 3,
    role: 0,
    usePrefix: false, // MODE SANS PRÉFIXE ACTIVÉ
    description: "💰 Système économique cyber-sanctuaire avec carte VIP",
    category: "economy",
    guide: {
      fr: "{pn} - voir ton solde\n{pn} @utilisateur - voir le solde d'un autre\n{pn} t @utilisateur montant - transférer de l'argent"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID, mentions, messageReply } = event;

    // === FORMATTAGE DE L'ARGENT ===
    const formatMoney = (amount) => {
      if (isNaN(amount)) return "0$";
      amount = Number(amount);
      const scales = [
        { value: 1e15, suffix: 'Q' },
        { value: 1e12, suffix: 'T' },
        { value: 1e9, suffix: 'B' },
        { value: 1e6, suffix: 'M' },
        { value: 1e3, suffix: 'k' }
      ];
      const scale = scales.find(s => amount >= s.value);
      if (scale) return `${(amount / scale.value).toFixed(1)}${scale.suffix}$`;
      return `${amount.toLocaleString()}$`;
    };

    // ==========================================
    // 1. SYSTÈME DE TRANSFERT D'ARGENT
    // ==========================================
    if (args[0]?.toLowerCase() === "t") {
      let targetID = Object.keys(mentions)[0] || messageReply?.senderID;
      const amountRaw = args.find(a => !isNaN(a));
      const amount = parseFloat(amountRaw);

      if (!targetID || isNaN(amount)) return message.reply("❌ Usage : bal t @utilisateur montant");
      if (targetID === senderID) return message.reply("❌ Vous ne pouvez pas vous envoyer de l'argent.");
      if (amount <= 0) return message.reply("❌ Le montant doit être supérieur à 0.");

      const sender = await usersData.get(senderID);
      const receiver = await usersData.get(targetID);
      if (!receiver) return message.reply("❌ Utilisateur cible introuvable.");

      const taxRate = 5;
      const tax = Math.ceil(amount * taxRate / 100);
      const total = amount + tax;

      if (sender.money < total) return message.reply(
        `❌ Fonds insuffisants.\nNécessaire : ${formatMoney(total)}\nVous avez : ${formatMoney(sender.money)}`
      );

      await Promise.all([
        usersData.set(senderID, { ...sender, money: sender.money - total }),
        usersData.set(targetID, { ...receiver, money: receiver.money + amount })
      ]);

      const receiverName = await usersData.getName(targetID);
      return message.reply(
        `✅ Transfert réussi ! 💸\n➤ Vers : ${receiverName}\n➤ Montant envoyé : ${formatMoney(amount)}\n➤ Taxe : ${formatMoney(tax)}\n➤ Total débité : ${formatMoney(total)}`
      );
    }

    // ==========================================
    // 2. GENERATION DE LA CARTE CANVAS FIXE (PNG)
    // ==========================================
    let targetID = Object.keys(mentions)[0] || messageReply?.senderID || senderID;

    const name = await usersData.getName(targetID).catch(() => "Utilisateur");
    const money = await usersData.get(targetID, "money") || 0;

    const width = 750, height = 350;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fond Sombre Cyber
    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, width, height);

    let darkGrad = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, 400);
    darkGrad.addColorStop(0, "rgba(25, 15, 45, 0.4)");
    darkGrad.addColorStop(1, "#000000");
    ctx.fillStyle = darkGrad;
    ctx.fillRect(0, 0, width, height);

    // Grille Techno
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }

    // Conteneur Principal
    ctx.fillStyle = "rgba(20, 20, 30, 0.85)";
    ctx.fillRect(40, 40, width - 80, height - 80);

    // Bordure Néon Violet / Or
    const neonColor = "#9d4edd";
    ctx.strokeStyle = neonColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Coins Tactiques
    ctx.fillStyle = "#00e5ff";
    const cornerSize = 15;
    ctx.fillRect(35, 35, cornerSize, 5); ctx.fillRect(35, 35, 5, cornerSize);
    ctx.fillRect(width - 35 - cornerSize, 35, cornerSize, 5); ctx.fillRect(width - 35, 35, 5, cornerSize);
    ctx.fillRect(35, height - 35, cornerSize, 5); ctx.fillRect(35, height - 35 - cornerSize, 5, cornerSize);
    ctx.fillRect(width - 35 - cornerSize, height - 35, cornerSize, 5); ctx.fillRect(width - 35, height - 35 - cornerSize, 5, cornerSize);

    // Chargement Avatar de l'utilisateur
    const avatarSize = 120;
    const avatarX = 75, avatarY = 115;
    let imgLoaded = false;

    try {
      const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=300&height=300&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const res = await axios.get(avatarUrl, { responseType: 'arraybuffer', timeout: 4000 });
      const avatarImg = await loadImage(Buffer.from(res.data));

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();
      imgLoaded = true;
    } catch (e) {
      imgLoaded = false;
    }

    if (!imgLoaded) {
      ctx.fillStyle = "#1e1028";
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 50px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("👤", avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 15);
    }

    // Cercle autour de l'avatar
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 2, 0, Math.PI * 2);
    ctx.stroke();

    // Textes
    ctx.fillStyle = "#00e5ff";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("CASSIDY BANKING SYSTEM", width - 60, 80);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "left";
    const cleanName = name.length > 18 ? name.substring(0, 16) + ".." : name;
    ctx.fillText(cleanName.toUpperCase(), 220, 155);

    ctx.font = "14px monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText(`ACC. HOLDER // ${targetID}`, 220, 185);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(220, 205); ctx.lineTo(width - 60, 205); ctx.stroke();

    ctx.font = "bold 13px sans-serif";
    ctx.fillStyle = neonColor;
    ctx.fillText("SOLDE DISPONIBLE", 220, 230);

    ctx.font = "bold 48px sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${formatMoney(money)}`, 220, 285);

    // Sauvegarde en image PNG
    const tmpDir = path.join(__dirname, "cache");
    await fs.ensureDir(tmpDir);
    const filePath = path.join(tmpDir, `bal_${Date.now()}_${targetID}.png`);
    await fs.outputFile(filePath, canvas.toBuffer("image/png"));

    return message.reply({
      body: `🖤 [ ᴍᴀɪsᴏɴ ᴄᴀssɪᴅʏ ] Fiche financière de ${name}`,
      attachment: fs.createReadStream(filePath)
    }, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
  }
};
