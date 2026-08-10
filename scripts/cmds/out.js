const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// 🎨 ENGIN CANVAS
async function generateOutCanvas(botId, botName, threadName, memberCount) {
    const cacheDir = path.join(__dirname, 'cache');
    await fs.ensureDir(cacheDir);
    
    const canvas = createCanvas(900, 450);
    const ctx = canvas.getContext('2d');

    // Fond
    let gradient = ctx.createLinearGradient(0, 0, 900, 450);
    gradient.addColorStop(0, '#110414');
    gradient.addColorStop(1, '#180a24');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 900, 450);

    // Cadres Néon
    ctx.strokeStyle = '#9d4edd'; 
    ctx.lineWidth = 4; 
    ctx.strokeRect(25, 25, 850, 400);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; 
    ctx.lineWidth = 1; 
    ctx.strokeRect(32, 32, 836, 386);

    // Avatar du Bot
    const avatarX = 190;
    const avatarY = 225;
    const avatarRadius = 110;

    let imgLoaded = false;
    try {
        const avatarUrl = `https://graph.facebook.com/${botId}/picture?width=400&height=400&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const res = await axios.get(avatarUrl, { responseType: 'arraybuffer', timeout: 3000 });
        const botAvatar = await loadImage(Buffer.from(res.data));

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(botAvatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.restore();
        imgLoaded = true;
    } catch (e) {
        imgLoaded = false;
    }

    if (!imgLoaded) {
        ctx.fillStyle = '#9d4edd'; 
        ctx.beginPath(); 
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2); 
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 50px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("🤖", avatarX, avatarY + 15);
    }

    // Contour Cercle Néon
    ctx.strokeStyle = '#9d4edd';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius + 2, 0, Math.PI * 2);
    ctx.stroke();

    // Textes
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9d4edd'; 
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText("🔌 DÉCONNEXION DU BOT", 380, 140);

    ctx.fillStyle = '#ffffff'; 
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`🤖 Nom : ${botName}`, 380, 205);
    
    const safeThreadName = (threadName || "Groupe Inconnu").substring(0, 22);
    ctx.fillText(`🏰 Groupe : ${safeThreadName}`, 380, 255);
    ctx.fillText(`👥 Membres : ${memberCount}`, 380, 305);

    const imagePath = path.join(cacheDir, `out_${Date.now()}_${botId}.png`);
    await fs.outputFile(imagePath, canvas.toBuffer('image/png'));
    return imagePath;
}

module.exports = {
    config: {
        name: "out",
        version: "2.2",
        author: "Celestin",
        role: 2, // Admin uniquement
        usePrefix: false, // MODE SANS PRÉFIXE ACTIVÉ
        shortDescription: "Fait quitter le bot du groupe",
        category: "admin"
    },

    onStart: async function ({ message, event, api }) {
        if (!event.isGroup) return message.reply("❌ Cette commande s'utilise uniquement dans un groupe.");

        try {
            const botId = api.getCurrentUserID();
            const threadInfo = await api.getThreadInfo(event.threadID);
            const botName = global.config?.botName || "Bot System";
            const memberCount = threadInfo.participantIDs ? threadInfo.participantIDs.length : 0;

            const imagePath = await generateOutCanvas(botId, botName, threadInfo.threadName, memberCount);

            await api.sendMessage({
                body: "🛑 Ordre d'exécution reçu. Procédure de sortie du réseau activée... Au revoir !",
                attachment: fs.createReadStream(imagePath)
            }, event.threadID);

            // Temporisation pour s'assurer que l'image est bien envoyée avant l'éjection
            setTimeout(async () => {
                try {
                    await api.removeUserFromGroup(botId, event.threadID);
                } catch (e) {
                    console.error("Erreur lors de l'expulsion du bot :", e);
                } finally {
                    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
                }
            }, 2000);

        } catch (error) {
            console.error(error);
            return message.reply("❌ Impossible de quitter le groupe automatiquement. Vérifiez les permissions du bot.");
        }
    }
};
