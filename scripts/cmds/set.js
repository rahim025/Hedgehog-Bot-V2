const { createCanvas } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "set",
    version: "3.0",
    author: "Christus",
    editor: "Célestin 🌌",
    shortDescription: "Gestion des données admin avec Canvas",
    longDescription: "Définir l'argent, l'expérience ou des variables d'un utilisateur sous forme visuelle (admin uniquement)",
    category: "Admin",
    guide: {
      fr: "{p}set money [montant] [@utilisateur]\n{p}set exp [montant] [@utilisateur]\n{p}set custom [variable] [valeur] [@utilisateur]"
    },
    role: 2,
    usePrefix: true
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { threadID, senderID } = event;

    try {
      // 1. Restriction de sécurité Admin
      const ADMIN_UIDS = ["61585948953933", "61568791604271"];
      if (!ADMIN_UIDS.includes(senderID.toString())) {
        return api.sendMessage("⛔ Accès refusé : privilèges admin requis", threadID);
      }

      const action = args[0]?.toLowerCase();
      if (!action || !['money', 'exp', 'custom'].includes(action)) {
        return api.sendMessage("❌ Action invalide. Options disponibles : money, exp, custom", threadID);
      }

      // Détection de la cible (mention ou soi-même)
      const targetID = Object.keys(event.mentions)[0] || senderID;
      const userData = await usersData.get(targetID);

      if (!userData) {
        return api.sendMessage("❌ Utilisateur introuvable dans la base de données", threadID);
      }

      let infoBadge = "";
      let detailValue = "";

      // 2. Traitement des actions
      if (action === 'money') {
        const amount = parseFloat(args[1]);
        if (isNaN(amount)) return api.sendMessage("❌ Montant invalide", threadID);
        await usersData.set(targetID, { money: amount });
        infoBadge = "ARGENT MODIFIÉ";
        detailValue = `Solde : ${amount} $`;

      } else if (action === 'exp') {
        const amount = parseFloat(args[1]);
        if (isNaN(amount)) return api.sendMessage("❌ Montant invalide", threadID);
        await usersData.set(targetID, { exp: amount });
        infoBadge = "EXPÉRIENCE MODIFIÉE";
        detailValue = `Points XP : ${amount}`;

      } else if (action === 'custom') {
        const variable = args[1];
        const value = args[2];
        if (!variable || value === undefined) {
          return api.sendMessage("❌ Utilisation : {p}set custom [variable] [valeur] [@utilisateur]", threadID);
        }
        await usersData.set(targetID, { [variable]: value });
        infoBadge = `VAR [${variable.toUpperCase()}]`;
        detailValue = `Valeur : ${value}`;
      }

      // 3. Rendu de l'interface Canvas Admin (Style Cyber Rouge & Noir)
      const width = 750;
      const height = 280;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Fond sombre technologique
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, width, height);

      // Grille de fond
      ctx.strokeStyle = '#1a1f2c';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 30) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      }
      for (let j = 0; j < height; j += 30) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
      }

      // Doubles bordures d'alerte rouge admin
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 4;
      ctx.strokeRect(15, 15, width - 30, height - 30);
      ctx.strokeStyle = '#880000';
      ctx.lineWidth = 1;
      ctx.strokeRect(22, 22, width - 44, height - 44);

      // Header de contrôle
      ctx.fillStyle = '#ff3333';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('◤ PANNEL DATABASE CONTROL ◢', 45, 50);

      // Tag de statut
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(45, 75, 200, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(infoBadge, 60, 95);

      // Informations sur l'utilisateur ciblé
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`Cible : ${userData.name || targetID}`, 45, 145);

      ctx.fillStyle = '#00ffcc';
      ctx.font = 'bold 26px monospace';
      ctx.fillText(`> ${detailValue}`, 45, 195);

      // Pied de page de sécurité
      ctx.fillStyle = '#555566';
      ctx.font = '12px monospace';
      ctx.fillText(`Modifié par l'Admin UID : ${senderID} • Christus System`, 45, height - 35);

      // 4. Stockage temporaire et Envoi de l'image
      const cacheDir = path.join(__dirname, 'cache');
      await fs.ensureDir(cacheDir);
      const cachePath = path.join(cacheDir, `set_${targetID}.png`);

      await fs.writeFile(cachePath, canvas.toBuffer('image/png'));

      await message.reply({
        body: `◤◢◣◥ UPDATE SUCCESS ◤◢◣◥\n\nLes données de l'utilisateur ont été mises à jour par l'administration.`,
        attachment: fs.createReadStream(cachePath)
      });

      // Nettoyage automatique
      setTimeout(() => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, 5000);

    } catch (error) {
      console.error("Erreur Admin Set :", error);
      return api.sendMessage("⚠️ Commande échouée : " + error.message, threadID);
    }
  }
};
