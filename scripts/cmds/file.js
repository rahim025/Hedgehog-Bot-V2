const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const axios = require('axios');

// Dégradé de fond équilibré pour le rendu de la carte
function getBalancedGradient(ctx, width, height) {
  let gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#020208');
  gradient.addColorStop(0.5, '#0c0d21');
  gradient.addColorStop(1, '#181b3a');
  return gradient;
}

// Génération de l'image de statut (Succès ou Erreur)
async function generateStatusCanvas(title, message, senderID, isSuccess = false) {
  const width = 850;
  const height = isSuccess ? 500 : 350;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const themeColor = isSuccess ? '#00f2fe' : '#ff0055';

  // Fond et filigrane textuel
  ctx.fillStyle = getBalancedGradient(ctx, width, height);
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
  ctx.font = 'bold 110px "Sans-Serif"';
  ctx.fillText("CELESTIN", 50, height - 50);

  // Bordures techno double-ligne
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 5;
  ctx.strokeRect(15, 15, width - 30, height - 30);
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(22, 22, width - 44, height - 44);

  const avatarX = 50;
  const avatarY = 55;
  const avatarSize = 95;

  // Profil circulaire pour l'avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
  ctx.clip();

  try {
    const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=300&height=300&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const response = await axios.get(avatarUrl, {
      responseType: 'arraybuffer',
      timeout: 5000
    });
    const avatarImg = await loadImage(Buffer.from(response.data));
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
  } catch (e) {
    ctx.fillStyle = '#0b0c16';
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    ctx.fillStyle = themeColor;
    ctx.font = 'bold 24px "Sans-Serif"';
    ctx.textAlign = 'center';
    ctx.fillText("ADMIN", avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 8);
    ctx.textAlign = 'left';
  }
  ctx.restore();

  // Cercle de bordure autour de l'avatar
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath(); 
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, (avatarSize / 2) + 3, 0, Math.PI * 2); 
  ctx.stroke();

  // En-tête textuel
  ctx.fillStyle = themeColor;
  ctx.font = 'bold 26px "Sans-Serif"';
  ctx.fillText(`⚜️ ${title} ⚜️`, avatarX + avatarSize + 30, 95);

  // Barre de chargement graphique
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(avatarX + avatarSize + 30, 115, 350, 8);
  ctx.fillStyle = themeColor;
  ctx.fillRect(avatarX + avatarSize + 30, 115, isSuccess ? 350 : 110, 8);

  // Ligne de division horizontale
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, 175); ctx.lineTo(width - 40, 175); ctx.stroke();

  // Affichage des lignes de code ou du message d'erreur
  ctx.fillStyle = '#ffffff';
  ctx.font = isSuccess ? '13px "Courier New"' : '18px "Sans-Serif"';
  
  const lines = message.split('\n');
  let y = 220;
  const maxLines = isSuccess ? 10 : 4;
  const displayLines = lines.slice(0, maxLines);

  for (const line of displayLines) {
    ctx.fillText(line, 50, y);
    y += isSuccess ? 22 : 32;
  }

  if (isSuccess) {
    ctx.fillStyle = themeColor;
    ctx.font = 'bold 14px "Sans-Serif"';
    ctx.fillText("👉 RÉPONDEZ (REPLY) À CETTE IMAGE POUR EXTRAIRE LE CODE SOURCE EN ENTIER", 50, height - 40);
  }

  // Enregistrement de l'image temporaire dans le cache
  const tmpDir = path.join(process.cwd(), "cache");
  await fs.ensureDir(tmpDir);
  const imagePath = path.join(tmpDir, `archive_${Date.now()}_${senderID}.png`);
  await fs.outputFile(imagePath, canvas.toBuffer('image/png'));
  return imagePath;
}

module.exports = {
  config: {
    name: "file",
    aliases: ["f"],
    version: "8.1",
    author: "rahim",
    countDown: 5,
    role: 0,
    usePrefix: false, // MODE SANS PRÉFIXE ACTIVÉ
    shortDescription: "Send bot script",
    longDescription: "Affiche le script sous forme de Canvas sécurisé sans préfixe requis.",
    category: "owner",
    guide: { fr: "{pn} [nom_du_fichier]" }
  },

  onStart: async function (context) {
    const api = context.api || this.api;
    const event = context.event || this.event;
    const args = context.args || [];
    if (!api || !event) return;

    const senderID = event.senderID;
    
    // Remplace ou ajoute ton UID d'administrateur principal ici
    const permissions = ["61585948953933"]; 

    if (!permissions.includes(senderID)) {
      const imgPath = await generateStatusCanvas("ACCÈS REFUSÉ", "Tu n’es pas autorisé à utiliser cette commande.", senderID, false);
      return api.sendMessage({ attachment: fs.createReadStream(imgPath) }, event.threadID, () => { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); }, event.messageID);
    }

    const fileName = args[0];
    if (!fileName) {
      const imgPath = await generateStatusCanvas("COMMANDE INCOMPLÈTE", "Indiquez le nom du fichier.\nExemple : file bal", senderID, false);
      return api.sendMessage({ attachment: fs.createReadStream(imgPath) }, event.threadID, () => { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); }, event.messageID);
    }

    // Cherche le fichier ciblé dans le même dossier
    const filePath = path.join(__dirname, `${fileName}.js`);
    if (!fs.existsSync(filePath)) {
      const imgPath = await generateStatusCanvas("FICHIER INTROUVABLE", `Le fichier "${fileName}.js" n’existe pas dans ce répertoire.`, senderID, false);
      return api.sendMessage({ attachment: fs.createReadStream(imgPath) }, event.threadID, () => { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); }, event.messageID);
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const imgPath = await generateStatusCanvas(`ARCHIVE SECRÈTE : ${fileName}.js`, fileContent, senderID, true);

      return api.sendMessage({ attachment: fs.createReadStream(imgPath) }, event.threadID, (err, info) => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        if (err) return console.error(err);

        const replyData = {
          commandName: this.config.name,
          messageID: info.messageID,
          author: senderID,
          content: fileContent,
          fileName: fileName
        };

        // Sauvegarde des données de réponse compatible multi-frameworks (GoatBot/Mirai)
        if (global.GoatBot && global.GoatBot.onReply) {
          global.GoatBot.onReply.set(info.messageID, replyData);
        } else if (global.client && global.client.handleReply) {
          global.client.handleReply.push(replyData);
        } else if (context.handleReply) {
          context.handleReply.push(replyData);
        }
      }, event.messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage("⚠️ Erreur lors du traitement ou du chargement de l'archive.", event.threadID);
    }
  },

  // Gestion du Reply pour envoyer le code brut au format texte indenté
  onReply: async function (context) {
    const { api, event } = context;
    const handleReply = context.reply || context.handleReply || (global.GoatBot && global.GoatBot.onReply ? global.GoatBot.onReply.get(event.messageReply?.messageID) : null);
    
    if (!handleReply) return;

    const { author, content, fileName, messageID } = handleReply;
    
    // Protection : Seul l'admin ayant fait la demande peut obtenir le code
    if (event.senderID !== author) return;

    try {
      await api.sendMessage({
        body: `࿇ ══━━✥👑✥━━══ ࿇\n     📦 CODE BRUT DÉVERROUILLÉ\n࿇ ══━━✥👑✥━━══ ࿇\n\n📜 Fichier : ${fileName}.js\n\n\`\`\`javascript\n${content}\n\`\`\``
      }, event.threadID, event.messageID);
    } catch (e) {
      console.error(e);
    } finally {
      if (global.GoatBot && global.GoatBot.onReply) {
        global.GoatBot.onReply.delete(messageID);
      }
    }
  }
};
