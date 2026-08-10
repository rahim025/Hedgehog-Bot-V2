const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs-extra');
const path = require('path');
const os = require("os");
const moment = require("moment-timezone");
const axios = require('axios');

// ==========================================
// 🎨 ENGIN CANVAS POUR LE BADGE SYSTEM UPTIME
// ==========================================
async function generateUptimeCanvas(userId, userName, botUpt, serverUpt, cpu, ram, time) {
	const canvas = createCanvas(900, 480);
	const ctx = canvas.getContext('2d');

	// Fond dégradé technologique "Midnight Violet"
	let gradient = ctx.createLinearGradient(0, 0, 900, 480);
	gradient.addColorStop(0, '#0d0b18');
	gradient.addColorStop(0.5, '#16122c');
	gradient.addColorStop(1, '#0d0b18');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Cadres doubles gravés (Néon Cyan / Blanc)
	ctx.strokeStyle = '#00f5d4';
	ctx.lineWidth = 4;
	ctx.strokeRect(25, 25, 850, 430);
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 1;
	ctx.strokeRect(32, 32, 836, 416);

	// Séparateurs de style
	ctx.fillStyle = '#00f5d4';
	ctx.font = 'bold 16px "Sans-Serif"';
	ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 420, 65);
	ctx.fillText("✧ ▬▭▬ ▬▬ ✦ ▬▬ ▬▭▬ ✧", 420, 425);

	// Incrustation de l'avatar Facebook de l'utilisateur
	const avatarX = 190;
	const avatarY = 240;
	const avatarRadius = 110;

	let imgLoaded = false;
	try {
		const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=300&height=300&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
		const res = await axios.get(avatarUrl, { responseType: 'arraybuffer', timeout: 4000 });
		const userAvatar = await loadImage(Buffer.from(res.data));

		ctx.save();
		ctx.beginPath();
		ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();
		ctx.drawImage(userAvatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
		ctx.restore();
		imgLoaded = true;
	} catch (e) {
		imgLoaded = false;
	}

	if (!imgLoaded) {
		ctx.fillStyle = '#0d0b18';
		ctx.beginPath();
		ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = '#00f5d4';
		ctx.font = 'bold 50px "Sans-Serif"';
		ctx.textAlign = 'center';
		ctx.fillText("📊", avatarX, avatarY + 15);
	}

	// Anneau lumineux néon
	ctx.strokeStyle = '#00f5d4';
	ctx.lineWidth = 6;
	ctx.beginPath();
	ctx.arc(avatarX, avatarY, avatarRadius + 2, 0, Math.PI * 2);
	ctx.stroke();

	// --- ÉCRITURE DES DONNÉES SUR L'IMAGE ---
	ctx.textAlign = 'left';
	ctx.fillStyle = '#00f5d4';
	ctx.font = 'bold 36px "Sans-Serif"';
	ctx.fillText("📊 STATUTS ET COEFFICIENTS", 420, 120);

	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 22px "Sans-Serif"';
	let cleanName = userName.length > 20 ? userName.substring(0, 20) + "..." : userName;
	ctx.fillText(`👤 Request by : ${cleanName}`, 420, 175);

	ctx.fillStyle = '#ffffff';
	ctx.font = '20px "Sans-Serif"';
	ctx.fillText(`🤖 BOT UPTIME     :  ${botUpt}`, 420, 225);
	ctx.fillText(`🌐 SERVER UPTIME  :  ${serverUpt}`, 420, 265);
	ctx.fillText(`⚙️ PROCESSOR     :  ${cpu} GHz`, 420, 305);
	ctx.fillText(`💾 RAM METRICS    :  ${ram}`, 420, 345);

	ctx.fillStyle = '#888888';
	ctx.font = 'italic 16px "Sans-Serif"';
	ctx.fillText(`⏰ ${time}`, 420, 385);

	const tmpDir = path.join(__dirname, "cache");
	await fs.ensureDir(tmpDir);
	const imagePath = path.join(tmpDir, `uptime_${Date.now()}_${userId}.png`);
	await fs.outputFile(imagePath, canvas.toBuffer('image/png'));
	return imagePath;
}

module.exports = {
	config: {
		name: "uptime",
		aliases: ["upt", "up"],
		version: "4.1",
		author: "Messie x Célestin 🔥 (Canvas Edition)",
		role: 0,
		usePrefix: false, // MODE SANS PRÉFIXE ACTIVÉ
		category: "system",
		shortDescription: {
			en: "System status printed on Canvas"
		}
	},

	onStart: async ({ api, event, usersData }) => {
		try {
			const senderID = event.senderID;
			const userName = await usersData.getName(senderID).catch(() => "Utilisateur");

			// Formatage de l'Uptime
			const format = (s) => {
				const d = Math.floor(s / 86400);
				const h = Math.floor((s % 86400) / 3600);
				const m = Math.floor((s % 3600) / 60);
				const sec = Math.floor(s % 60);
				return `${d}j ${h}h ${m}m ${sec}s`;
			};

			const botUptime = format(process.uptime());
			const serverUptime = format(os.uptime());

			const cpu = (os.cpus()[0].speed / 1000).toFixed(2);
			const totalMem = os.totalmem() / 1024 / 1024 / 1024;
			const usedMem = (os.totalmem() - os.freemem()) / 1024 / 1024 / 1024;
			const ramText = `${usedMem.toFixed(2)} / ${totalMem.toFixed(2)} GB`;

			const time = moment().tz("Africa/Kinshasa").format("HH:mm:ss | DD/MM/YYYY");

			// Génération de la carte graphique
			const imagePath = await generateUptimeCanvas(
				senderID,
				userName,
				botUptime,
				serverUptime,
				cpu,
				ramText,
				time
			);

			const msg = `╭───「 SYSTEM 」───╮\n\n👤 𝑼𝒕𝒊𝒍𝒊𝒔𝒂𝒕𝒆𝒖𝒓 : ${userName}\n🤖 𝑩𝑶𝑻 : ${botUptime}\n\n📊 Graphique généré avec succès !`;

			return api.sendMessage({
				body: msg,
				attachment: fs.createReadStream(imagePath)
			}, event.threadID, () => {
				if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
			}, event.messageID);

		} catch (err) {
			console.error(err);
			return api.sendMessage("❌ Erreur lors du rendu de la carte système.", event.threadID);
		}
	},

	onReply: async ({ api, event }) => {
		return api.sendMessage("📊 Utilise uptime pour générer ton rapport système complet.", event.threadID);
	}
};
		
