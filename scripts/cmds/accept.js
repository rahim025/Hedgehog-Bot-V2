"use strict";

const moment = require("moment-timezone");
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

// 1. CANVAS DE STATUT ET ERREURS (HUD COMPACT PREMIUM)
async function generateStatusCanvas(title, messageText, isError = true) {
  const width = 650;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  let gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#020205');
  gradient.addColorStop(0.5, '#070b19');
  gradient.addColorStop(1, '#020205');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = isError ? 'rgba(255, 59, 48, 0.2)' : 'rgba(0, 122, 255, 0.2)';
  ctx.lineWidth = 8;
  ctx.strokeRect(15, 15, width - 30, height - 30);
  
  ctx.strokeStyle = isError ? '#ff2d55' : '#00e5ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 22, width - 44, height - 44);

  ctx.fillStyle = isError ? '#ff3b30' : '#00e5ff';
  ctx.font = 'bold 26px "Sans-Serif"';
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, 75);

  ctx.fillStyle = isError ? 'rgba(255, 45, 85, 0.4)' : 'rgba(0, 229, 255, 0.4)';
  ctx.font = '13px "Sans-Serif"';
  ctx.fillText("✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧", width / 2, 115);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px "Sans-Serif"';
  const lines = messageText.split('\n');
  let startY = 170;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], width / 2, startY + (i * 30));
  }

  const footerY = height - 45;
  ctx.fillStyle = isError ? 'rgba(255, 45, 85, 0.3)' : 'rgba(0, 229, 255, 0.3)';
  ctx.fillText("✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧", width / 2, footerY - 10);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '9px "Sans-Serif"';
  ctx.fillText("⚡ CORE SYSTEM NETWORK SECURED 100% ⚡", width / 2, footerY + 10);

  const tmpDir = path.join(process.cwd(), "cache");
  await fs.ensureDir(tmpDir);
  const imagePath = path.join(tmpDir, `acp_status_${Date.now()}.png`);
  fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
  return imagePath;
}

// 2. CANVAS DE LISTE DES DEMANDES AVEC PHOTO DE PROFIL À CÔTÉ DE CHAQUE USER
async function generateListCanvas(listRequest) {
  const width = 650;
  const startY = 160;
  const rowHeight = 75; // Ligne élargie pour accueillir confortablement les avatars
  const baseFooterHeight = 100;
  
  const height = startY + (Math.max(listRequest.length, 1) * rowHeight) + baseFooterHeight;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  let gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#020205');
  gradient.addColorStop(0.5, '#060914');
  gradient.addColorStop(1, '#020205');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Bordures extérieures cyan
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  // Coins stylisés
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(13, 13, 20, 4); ctx.fillRect(13, 13, 4, 20);
  ctx.fillRect(width - 33, 13, 20, 4); ctx.fillRect(width - 17, 13, 4, 20);

  // Titre principal
  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 24px "Sans-Serif"';
  ctx.textAlign = 'center';
  ctx.fillText("🎯 REQUÊTES FLUX RÉSEAU", width / 2, 70);

  ctx.fillStyle = 'rgba(0, 229, 255, 0.3)';
  ctx.font = '13px "Sans-Serif"';
  ctx.fillText("✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧", width / 2, 105);

  ctx.fillStyle = '#8e8e93';
  ctx.font = '12px "Sans-Serif"';
  ctx.fillText(`FALCON ENGINE v4.0 BY CÉLESTIN  //  ${listRequest.length} TARGETS`, width / 2, 130);

  if (listRequest.length === 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'italic 16px "Sans-Serif"';
    ctx.fillText("Flux vide. Aucune signature d'invitation détectée.", width / 2, startY + 60);
  } else {
    for (let i = 0; i < listRequest.length; i++) {
      const user = listRequest[i].node;
      const currentY = startY + (i * rowHeight);

      // Fond de ligne
      ctx.fillStyle = 'rgba(0, 229, 255, 0.02)';
      ctx.fillRect(40, currentY, width - 80, 64);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, currentY, width - 80, 64);

      // Tag numéro [1], [2], ...
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 15px "Sans-Serif"';
      ctx.fillText(`[${i + 1}]`, 65, currentY + 38);

      // --- RENDU DE LA PHOTO DE PROFIL DE L'UTILISATEUR ---
      const avatarX = 115;
      const avatarY = currentY + 32;
      const avatarRadius = 22;

      let userAvatar;
      try {
        const avatarUrl = `https://graph.facebook.com/${user.id}/picture?width=150&height=150&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        userAvatar = await loadImage(avatarUrl);
      } catch (e) {
        userAvatar = null;
      }

      if (userAvatar) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(userAvatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.restore();

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius + 1, 0, Math.PI * 2, true);
        ctx.stroke();
      } else {
        // Fallback avec l'initiale de l'utilisateur
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px "Sans-Serif"';
        ctx.textAlign = 'center';
        ctx.fillText((user.name ? user.name[0] : '?').toUpperCase(), avatarX, avatarY + 6);
      }

      // Nom & UID décalés à droite de l'avatar
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Sans-Serif"';
      let name = user.name || "Unknown Identity";
      if (name.length > 22) name = name.substring(0, 20) + "..";
      ctx.fillText(name, 150, currentY + 28);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '11px "Sans-Serif"';
      ctx.fillText(`UID // ${user.id}`, 150, currentY + 48);
    }
  }

  ctx.textAlign = 'center';
  const loadingY = height - 60;
  ctx.fillStyle = 'rgba(0, 229, 255, 0.3)';
  ctx.font = '13px "Sans-Serif"';
  ctx.fillText("✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧", width / 2, loadingY);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px "Sans-Serif"';
  ctx.fillText("INTERACTION REQUISES : <add | del> <num | all>", width / 2, loadingY + 24);

  const tmpDir = path.join(process.cwd(), "cache");
  await fs.ensureDir(tmpDir);
  const imagePath = path.join(tmpDir, `acp_list_${Date.now()}.png`);
  fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
  return imagePath;
}

module.exports = {
  config: {
    name: "accept",
    aliases: ['acp'],
    version: "4.0",
    author: "Célestin",
    countDown: 20,
    role: 2,
    usePrefix: false, // MODE SANS PRÉFIXE
    shortDescription: "Manage friend requests",
    longDescription: "Accept or delete friend requests with a clean cyber HUD style and profile picture for each user",
    category: "Utility",
  },

  onReply: async function ({ message, Reply, event, api, commandName }) {
    const { author, listRequest, messageID } = Reply;
    if (author !== event.senderID) return;
    const args = event.body.replace(/ +/g, " ").toLowerCase().split(" ");

    clearTimeout(Reply.unsendTimeout);

    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: {
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.round(Math.random() * 19).toString()
        },
        scale: 3,
        refresh_num: 0
      }
    };

    const success = [];
    const failed = [];

    if (args[0] === "add") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
    }
    else if (args[0] === "del") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
    }
    else {
      const errorText = "Arguments incorrects.\nVeuillez envoyer la commande 'add' ou 'del'.";
      const imagePath = await generateStatusCanvas("SYNTAX ERROR", errorText, true);
      return message.reply({ attachment: fs.createReadStream(imagePath) }, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      });
    }

    let targetIDs = args.slice(1);

    if (args[1] === "all") {
      targetIDs = [];
      const lengthList = listRequest.length;
      for (let i = 1; i <= lengthList; i++) targetIDs.push(i);
    }

    const newTargetIDs = [];
    const promiseFriends = [];

    for (const stt of targetIDs) {
      const u = listRequest[parseInt(stt) - 1];
      if (!u) {
        failed.push(`Index #${stt} introuvable`);
        continue;
      }
      form.variables.input.friend_requester_id = u.node.id;
      form.variables = JSON.stringify(form.variables);
      newTargetIDs.push(u);
      promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
      form.variables = JSON.parse(form.variables);
    }

    const lengthTarget = newTargetIDs.length;
    for (let i = 0; i < lengthTarget; i++) {
      try {
        const friendRequest = await promiseFriends[i];
        if (JSON.parse(friendRequest).errors) {
          failed.push(newTargetIDs[i].node.name);
        }
        else {
          success.push(newTargetIDs[i].node.name);
        }
      }
      catch (e) {
        failed.push(newTargetIDs[i].node.name);
      }
    }

    if (success.length > 0) {
      const statusText = `Synchronisation réseau terminée par Célestin.\nProfils valides : ${success.length}\nÉchecs enregistrés : ${failed.length}`;
      const imagePath = await generateStatusCanvas("OPERATION COMPLETE", statusText, false);
      
      api.sendMessage({
        body: `✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n      DATALINK REPORT\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n\n🔹 SUCCESS : ${success.length} têtes\n🔸 FAILED  : ${failed.length} têtes\n\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧`,
        attachment: fs.createReadStream(imagePath)
      }, event.threadID, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }, event.messageID);
    } else {
      try { api.unsendMessage(messageID); } catch(e) {}
      const errorText = "Le pare-feu distant a bloqué l'opération.\nAucun changement appliqué.";
      const imagePath = await generateStatusCanvas("LINK REFUSED", errorText, true);
      return message.reply({ attachment: fs.createReadStream(imagePath) }, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      });
    }

    try { api.unsendMessage(messageID); } catch(e) {}
  },

  onStart: async function ({ event, api, commandName }) {
    const form = {
      av: api.getCurrentUserID(),
      fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
      fb_api_caller_class: "RelayModern",
      doc_id: "4499164963466303",
      variables: JSON.stringify({ input: { scale: 3 } })
    };
    
    try {
      const listRequest = JSON.parse(await api.httpPost("https://www.facebook.com/api/graphql/", form)).data.viewer.friending_possibilities.edges;
      
      const imagePath = await generateListCanvas(listRequest);

      api.sendMessage({
        body: "✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\n      FALCON LINK ACTIVE\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧\nLecture de la table d'indexation...\n✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧",
        attachment: fs.createReadStream(imagePath)
      }, event.threadID, (e, info) => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          listRequest,
          author: event.senderID,
          unsendTimeout: setTimeout(() => {
            try { api.unsendMessage(info.messageID); } catch(err) {}
          }, this.config.countDown * 1000)
        });
      }, event.messageID);

    } catch (err) {
      const errorText = "Liaison au serveur principal rompue.\nVeuillez relancer le proxy.";
      const imagePath = await generateStatusCanvas("CONNECTION TIMEOUT", errorText, true);
      return api.sendMessage({ attachment: fs.createReadStream(imagePath) }, event.threadID, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }, event.messageID);
    }
  }
};
