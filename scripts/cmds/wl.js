const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// 🎨 Fonction de génération du Badge Whitelist
async function generateWhitelistCanvas(userName, userId, action) {
    const canvas = createCanvas(800, 300);
    const ctx = canvas.getContext('2d');

    // Fond
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 800, 300);
    ctx.strokeStyle = action === "add" ? '#10b981' : '#ef4444';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, 800, 300);

    // Avatar
    try {
        const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=200&height=200&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const res = await axios.get(avatarUrl, { responseType: 'arraybuffer', timeout: 3000 });
        const avatar = await loadImage(Buffer.from(res.data));

        ctx.save();
        ctx.beginPath();
        ctx.arc(100, 150, 60, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, 40, 90, 120, 120);
        ctx.restore();
    } catch (e) {
        // Fallback en cas d'échec du chargement d'image
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(100, 150, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("👤", 100, 160);
    }

    // Texte
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 35px sans-serif';
    ctx.fillText("SYSTÈME WHITELIST", 200, 120);
    
    ctx.fillStyle = action === "add" ? '#10b981' : '#ef4444';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(action === "add" ? "UTILISATEUR AJOUTÉ" : "UTILISATEUR RETIRÉ", 200, 180);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Nom : ${userName}`, 200, 220);

    const tmpDir = path.join(__dirname, 'cache');
    await fs.ensureDir(tmpDir);
    const p = path.join(tmpDir, `wl_${Date.now()}_${userId}.png`);
    await fs.outputFile(p, canvas.toBuffer('image/png'));
    return p;
}

module.exports = {
    config: {
        name: "whitelist",
        version: "1.2",
        author: "Celestin",
        role: 2,
        usePrefix: false, // MODE SANS PRÉFIXE ACTIVÉ
        category: "admin"
    },

    onStart: async function ({ message, event, args, usersData }) {
        const action = args[0]?.toLowerCase(); // add ou del
        let targetID = event.messageReply?.senderID || Object.keys(event.mentions)[0] || args[1];

        if (!targetID || !['add', 'del'].includes(action)) {
            return message.reply("⚠️ Usage : whitelist add/del @tag ou répondre à un message");
        }

        const userName = await usersData.getName(targetID).catch(() => "Utilisateur Inconnu");
        
        // --- LOGIQUE DE TA BASE DE DONNÉES ICI ---
        // Ex: const wl = global.db.whitelist;
        // ... ajoute ou retire targetID de ta liste ...

        // Génération de l'image
        const imagePath = await generateWhitelistCanvas(userName, targetID, action);
        
        return message.reply({
            body: action === "add" ? "✅ Ajouté avec succès à la whitelist." : "🌿 Retiré de la whitelist.",
            attachment: fs.createReadStream(imagePath)
        }, () => {
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        
        });
    }
};
