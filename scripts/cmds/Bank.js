"use strict";

// ═══════════════════════════════════════════════════════════════════════════════
//  STUDIO BANK SYSTEM v2026 — Clean & Minimal Cobalt Edition (Dynamic Avatar)
//  Canvas   : 900 × 500 px — Interface Bancaire Premium Épurée avec Profil FB
// ═══════════════════════════════════════════════════════════════════════════════

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const moment = require("moment-timezone");

let loadImage, createCanvas, registerFont;
let canvasAvailable = false;
try {
  const cv = require("canvas");
  loadImage    = cv.loadImage;
  createCanvas = cv.createCanvas;
  registerFont = cv.registerFont;
  canvasAvailable = true;
} catch (e) { console.error("Canvas indisponible :", e.message); }

// Configuration des constantes bancaires
const INTEREST_RATE = 0.02; // 2% d'intérêts par action
const SUFFIXES = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };

// Polyfill pour roundRect si l'ancienne version de node-canvas est utilisée
if (canvasAvailable) {
  const { CanvasRenderingContext2D } = require("canvas");
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }
}

function fmt(n) {
  if (n == null || isNaN(n)) return "$0";
  n = Number(n);
  const S = [{v:1e12,s:"T"},{v:1e9,s:"B"},{v:1e6,s:"M"},{v:1e3,s:"K"}];
  const sc = S.find(s => Math.abs(n) >= s.v);
  if (sc) return `${n<0?"-":""}$${(Math.abs(n)/sc.v).toFixed(2).replace(/\.00$/,"")}${sc.s}`;
  const p = Math.abs(n).toFixed(2).split(".");
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n<0?"-":""}$${p.join(".")}`;
}

function parseAmount(input, currentBalance) {
  if (!input) return NaN;
  if (input.toLowerCase() === "all") return currentBalance;
  const m = input.trim().toLowerCase().match(/^([\d,.]+)\s*([kmbt]?)$/i);
  if (!m) return NaN;
  let v = parseFloat(m[1].replace(/,/g, "."));
  if (m[2] && SUFFIXES[m[2]]) v *= SUFFIXES[m[2]];
  return isNaN(v) ? NaN : Math.floor(v);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ENGINE CANVAS - RENDU RELEVÉ DE COMPTE AVEC PHOTO DE PROFIL DYNAMIQUE
// ═══════════════════════════════════════════════════════════════════════════════
async function generateBankCanvas(userId, userName, cash, bank, statusText) {
  const canvas = createCanvas(900, 500);
  const ctx = canvas.getContext('2d');
  
  // Fond Studio Dark Slate
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Encart central transparent
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.roundRect(30, 30, 840, 440, 16);
  ctx.fill(); ctx.stroke();

  // Ligne d'accent supérieure (Cobalt)
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(30, 30, 840, 4);

  // --- TENTATIVE DE CHARGEMENT DE L'AVATAR FB ---
  let avatarLoaded = false;
  let avatarImg;
  try {
    const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=500&height=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    avatarImg = await loadImage(avatarUrl);
    avatarLoaded = true;
  } catch (e) {
    avatarLoaded = false;
  }

  const textStartX = 160;

  // Rendu de l'avatar en cercle
  if (avatarLoaded) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(100, 105, 40, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg, 60, 65, 80, 80);
    ctx.restore();

    // Cercle d'accentuation Cobalt
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(100, 105, 42, 0, Math.PI * 2, true);
    ctx.stroke();
  } else {
    // Fallback : Avatar par défaut avec initiale si l'image FB ne charge pas
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(100, 105, 40, 0, Math.PI * 2, true);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((userName[0] || 'U').toUpperCase(), 100, 116);
    ctx.textAlign = 'left';
  }

  // Titres du relevé
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText("RELEVÉ DE COMPTE BANCAIRE", textStartX, 95);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px sans-serif';
  ctx.fillText(`TITULAIRE : ${userName.toUpperCase()}  |  ID : ${userId}`, textStartX, 125);

  // Zone des Soldes
  // 1. Solde Liquide (Cash)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.roundRect(60, 170, 370, 120, 12); 
  ctx.fill();
  
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText("ARGENT LIQUIDE / CASH", 80, 205);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(fmt(cash), 80, 245);

  // 2. Solde Coffre (Bank)
  ctx.fillStyle = 'rgba(59, 130, 246, 0.04)';
  ctx.roundRect(470, 170, 370, 120, 12); 
  ctx.fill();
  
  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText("COMPTE ÉPARGNE SÉCURISÉ", 490, 205);
  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(fmt(bank), 490, 245);

  // Ligne de séparation
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.beginPath(); ctx.moveTo(60, 330); ctx.lineTo(840, 330); ctx.stroke();

  // Statut de la dernière transaction
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Dernière opération : ${statusText}`, 60, 375);

  // Pied de page
  const dateStr = moment().tz("Europe/Paris").format("DD.MM.YYYY // HH:mm");
  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px sans-serif';
  ctx.fillText(dateStr, 60, 435);
  ctx.fillText("SÉCURISÉ PAR CENTRAL STUDIO BANK", 590, 435);

  const tmpDir = path.join(__dirname, "..", "cache");
  await fs.ensureDir(tmpDir);
  const imagePath = path.join(tmpDir, `bank_${Date.now()}_${userId}.png`);
  fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
  return imagePath;
}

module.exports = {
  config: {
    name: "bank",
    version: "2026.3",
    author: "Célestin",
    countDown: 3,
    role: 0,
    usePrefix: false, // MODE SANS PRÉFIXE ACTIVÉ
    description: { fr: "Gère l'intégralité de vos finances : dépôts, retraits, épargne et virements." },
    category: "economy",
    guide: {
      fr: "bank [me / deposit / withdraw / transfer]\nExemples:\n• bank deposit 5k\n• bank withdraw all\n• bank transfer @user 10m"
    }
  },

  onStart: async function ({ message, event, args, usersData, api }) {
    const { senderID, mentions, messageReply } = event;
    const userData = await usersData.get(senderID);
    
    if (!userData.bank) userData.bank = 0;
    const cash = userData.money || 0;
    let bank = userData.bank || 0;
    const userName = userData.name || `User_${senderID}`;

    const action = args[0] ? args[0].toLowerCase() : "me";

    // Application des intérêts
    if (bank > 0) {
      const interests = Math.floor(bank * INTEREST_RATE);
      if (interests > 0) {
        bank += interests;
        await usersData.set(senderID, { bank: bank });
      }
    }

    switch (action) {
      case "me":
      case "info": {
        if (!canvasAvailable) {
          return message.reply(`✧ [ **CENTRAL BANK** ] ✧\n\n▫️ Argent liquide : ${fmt(cash)}\n▫️ Compte épargne : ${fmt(bank)}\n\n*Note : Votre épargne génère 2% d'intérêts cumulés par transaction.*`);
        }
        const imagePath = await generateBankCanvas(senderID, userName, cash, bank, "Consultation du solde courant.");
        return message.reply({ attachment: fs.createReadStream(imagePath) }, () => fs.unlinkSync(imagePath));
      }

      case "deposit":
      case "dep": {
        const amount = parseAmount(args[1], cash);
        if (isNaN(amount) || amount <= 0) return message.reply("▫️ Format ou montant spécifié invalide pour un dépôt.");
        if (cash < amount) return message.reply("▫️ Vos liquidités (Cash) sont insuffisantes pour effectuer ce dépôt.");

        const newCash = cash - amount;
        const newBank = bank + amount;

        await usersData.set(senderID, { money: newCash, bank: newBank });

        if (!canvasAvailable) return message.reply(`✦ Dépôt réussi : ${fmt(amount)} ont été placés dans votre coffre.`);
        const imagePath = await generateBankCanvas(senderID, userName, newCash, newBank, `Dépôt de +${fmt(amount)} validé.`);
        return message.reply({ attachment: fs.createReadStream(imagePath) }, () => fs.unlinkSync(imagePath));
      }

      case "withdraw":
      case "wd": {
        const amount = parseAmount(args[1], bank);
        if (isNaN(amount) || amount <= 0) return message.reply("▫️ Format ou montant spécifié invalide pour un retrait.");
        if (bank < amount) return message.reply("▫️ Le solde de votre compte épargne ne permet pas ce retrait.");

        const newCash = cash + amount;
        const newBank = bank - amount;

        await usersData.set(senderID, { money: newCash, bank: newBank });

        if (!canvasAvailable) return message.reply(`✦ Retrait effectué : ${fmt(amount)} retirés sous forme liquide.`);
        const imagePath = await generateBankCanvas(senderID, userName, newCash, newBank, `Retrait de -${fmt(amount)} validé.`);
        return message.reply({ attachment: fs.createReadStream(imagePath) }, () => fs.unlinkSync(imagePath));
      }

      case "transfer":
      case "trn": {
        let targetID = Object.keys(mentions)[0] || messageReply?.senderID;
        const amountArg = args.slice(1).find(a => /^[\d,.]+[kmbt]?$/i.test(a) || a.toLowerCase() === "all");
        const amount = parseAmount(amountArg, bank);

        if (!targetID) return message.reply("▫️ Erreur : Veuillez spécifier ou mentionner un compte bénéficiaire.");
        if (targetID === senderID) return message.reply("▫️ Opération rejetée : Impossible d'effectuer un virement sur votre propre compte.");
        if (isNaN(amount) || amount <= 0) return message.reply("▫️ Erreur : Montant de transaction invalide.");
        if (bank < amount) return message.reply("▫️ Erreur : Solde d'épargne insuffisant pour couvrir ce virement direct.");

        const targetData = await usersData.get(targetID);
        if (!targetData) return message.reply("▫️ Compte bénéficiaire introuvable dans la base de données.");

        const targetBank = targetData.bank || 0;
        const newSenderBank = bank - amount;
        const newReceiverBank = targetBank + amount;

        await Promise.all([
          usersData.set(senderID, { bank: newSenderBank }),
          usersData.set(targetID, { bank: newReceiverBank })
        ]);

        let receiverName = targetData.name || `User_${targetID}`;
        try {
          const fbInfo = await api.getUserInfo(targetID);
          if (fbInfo && fbInfo[targetID]) {
            receiverName = fbInfo[targetID].name || receiverName;
          }
        } catch (_) {}

        if (!canvasAvailable) return message.reply(`✦ Virement validé : ${fmt(amount)} virés sur le compte bancaire de ${receiverName}.`);
        const imagePath = await generateBankCanvas(senderID, userName, cash, newSenderBank, `Virement de ${fmt(amount)} envoyé à ${receiverName.slice(0, 12)}.`);
        return message.reply({ attachment: fs.createReadStream(imagePath) }, () => fs.unlinkSync(imagePath));
      }

      default:
        return message.reply("⚙️ Argument inconnu. Syntaxe requise : bank [me / deposit / withdraw / transfer]");
    }
  }
};
