const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { utils } = global;

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

// Palette de couleurs aléatoires (Rose, Cyber, Gold, Mint, Cyan, Purple)
function getRandomThemeColor() {
	const colors = [
		"#ff0055", // Neon Rose 🌹
		"#e0115f", // Ruby Red 💎
		"#ff1493", // Deep Pink 🌸
		"#9d4edd", // Cyber Violet 🔮
		"#00f5d4", // Mint Green 🌿
		"#00b4d8", // Electric Cyan ⚡
		"#ffb703"  // Gold Flame 🔥
	];
	return colors[Math.floor(Math.random() * colors.length)];
}

// ==========================================
// 🎨 ENGINE CANVAS STATIQUE COLORÉ (1000x580)
// ==========================================
async function generatePrefixCanvas(userId, title, prefixText, detailsText, themeColor = null, badgeText = "SYSTEM") {
	if (!themeColor) themeColor = getRandomThemeColor();

	const width = 1000;
	const height = 580;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	// 1. Fond sombre avec dégradé radial
	let gradient = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
	gradient.addColorStop(0, '#120517');
	gradient.addColorStop(0.6, '#08020a');
	gradient.addColorStop(1, '#020004');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);

	// 2. Halo lumineux d'arrière-plan avec la couleur du thème
	const glowGrad = ctx.createRadialGradient(670, 320, 10, 670, 320, 260);
	glowGrad.addColorStop(0, `${themeColor}33`);
	glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
	ctx.fillStyle = glowGrad;
	ctx.fillRect(0, 0, width, height);

	// 3. Cadre Néon dynamique
	ctx.strokeStyle = themeColor;
	ctx.lineWidth = 4;
	drawRoundedRect(ctx, 30, 30, width - 60, height - 60, 20);
	ctx.stroke();

	ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
	ctx.lineWidth = 1.5;
	drawRoundedRect(ctx, 38, 38, width - 76, height - 76, 16);
	ctx.stroke();

	// 4. Positionnement Avatar
	const avatarX = 200;
	const avatarY = 290;
	const radius = 110;

	// Double anneau stylisé
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
	ctx.lineWidth = 6;
	ctx.beginPath();
	ctx.arc(avatarX, avatarY, radius + 15, 0, Math.PI * 2);
	ctx.stroke();

	ctx.strokeStyle = themeColor;
	ctx.lineWidth = 6;
	ctx.beginPath();
	ctx.arc(avatarX, avatarY, radius + 15, -Math.PI / 3, Math.PI / 2);
	ctx.stroke();

	// Récupération de l'avatar
	let userAvatar = null;
	const avatarUrl = `https://graph.facebook.com/${userId}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
	
	try {
		const res = await axios.get(avatarUrl, { responseType: 'arraybuffer', timeout: 3000 });
		userAvatar = await loadImage(Buffer.from(res.data));
	} catch (e) {}

	// Rendu Avatar
	ctx.save();
	ctx.beginPath();
	ctx.arc(avatarX, avatarY, radius, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();

	if (userAvatar) {
		ctx.drawImage(userAvatar, avatarX - radius, avatarY - radius, radius * 2, radius * 2);
	} else {
		ctx.fillStyle = themeColor;
		ctx.fillRect(avatarX - radius, avatarY - radius, radius * 2, radius * 2);
		ctx.fillStyle = '#ffffff';
		ctx.font = 'bold 50px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText("🌹", avatarX, avatarY + 15);
	}
	ctx.restore();

	// Contour lumineux Avatar
	ctx.strokeStyle = themeColor;
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.arc(avatarX, avatarY, radius + 2, 0, Math.PI * 2);
	ctx.stroke();

	// 5. Badge Statut
	ctx.fillStyle = themeColor;
	drawRoundedRect(ctx, width - 185, 65, 120, 30, 6);
	ctx.fill();

	ctx.fillStyle = '#000000';
	ctx.font = 'bold 12px sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText(badgeText.toUpperCase(), width - 125, 85);

	// 6. Textes de gauche
	ctx.textAlign = 'left';
	ctx.fillStyle = '#FFFFFF';
	ctx.font = 'bold 38px sans-serif';
	ctx.fillText(truncateText(ctx, title.toUpperCase(), 450), 420, 115);

	ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
	ctx.font = '16px sans-serif';
	ctx.fillText(truncateText(ctx, detailsText, 450), 420, 155);

	const decoration = "🌹 ─── ❖ ── ✦ ── ❖ ─── 🌹";

	// Séparateur haut
	ctx.fillStyle = themeColor;
	ctx.font = 'bold 18px sans-serif';
	ctx.fillText(decoration, 420, 215);

	// 7. Rendu du préfixe géant au centre
	ctx.textAlign = 'center';
	ctx.fillStyle = '#FFFFFF';
	ctx.font = 'bold 130px sans-serif';
	ctx.fillText(prefixText, 670, 350);

	// Label inférieur
	ctx.fillStyle = themeColor;
	ctx.font = 'bold 14px sans-serif';
	ctx.fillText("⚡ SYSTEM COMMAND TERMINAL ⚡", 670, 400);

	// Séparateur bas
	ctx.textAlign = 'left';
	ctx.fillStyle = themeColor;
	ctx.font = 'bold 18px sans-serif';
	ctx.fillText(decoration, 420, 455);

	// Footer
	ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
	ctx.font = '11px sans-serif';
	ctx.fillText("» ROSÉ SYSTEM CANVAS EDITION V5.0 «", 420, 510);

	// Sauvegarde image
	const tmpDir = path.join(__dirname, "cache");
	await fs.ensureDir(tmpDir);
	const imagePath = path.join(tmpDir, `prefix_${Date.now()}_${userId}.png`);
	await fs.outputFile(imagePath, canvas.toBuffer('image/png'));
	return imagePath;
}

module.exports = {
	config: {
		name: "prefix",
		version: "5.0.0",
		author: "NTKhang x Célestin 🌹",
		countDown: 2,
		role: 0,
		description: "Affiche ou modifie le préfixe avec une carte visuelle élégante",
		category: "config",
		guide: {
			en: "   {pn} <nouveau préfixe>\n   Exemple: {pn} #\n\n   {pn} reset"
		}
	},

	onStart: async function ({ message, role, args, commandName, event, threadsData }) {
		const senderID = event.senderID;
		const chatDeco = "🌹 ════════════════════ 🌹";

		if (!args[0]) {
			const sysPrefix = global.GoatBot.config.prefix;
			const groupPrefix = utils.getPrefix(event.threadID);
			const imagePath = await generatePrefixCanvas(senderID, "Core System", groupPrefix, `Global : [ ${sysPrefix} ]`, null, "ACTIVE");
			
			return message.reply({
				body: `${chatDeco}\n⚙️ **PRÉFIXE DU GROUPE :** [ ${groupPrefix} ]\n🌍 **PRÉFIXE GLOBAL :** [ ${sysPrefix} ]\n${chatDeco}`,
				attachment: fs.createReadStream(imagePath)
			}, () => {
				if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
			});
		}

		if (args[0] == 'reset') {
			await threadsData.set(event.threadID, null, "data.prefix");
			const defaultPrefix = global.GoatBot.config.prefix;
			const imagePath = await generatePrefixCanvas(senderID, "Reset System", defaultPrefix, "Retour aux réglages usine", "#ffb703", "RESET");
			
			return message.reply({
				body: `${chatDeco}\n🔄 **RÉINITIALISATION RÉUSSIE**\nPréfixe par défaut : [ ${defaultPrefix} ]\n${chatDeco}`,
				attachment: fs.createReadStream(imagePath)
			}, () => {
				if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
			});
		}

		const newPrefix = args[0];
		const formSet = { commandName, author: senderID, newPrefix };

		if (args[1] === "-g") {
			if (role < 2) return;
			formSet.setGlobal = true;
		} else {
			formSet.setGlobal = false;
		}

		return message.reply(
			`${chatDeco}\n⚠️ **CONFIRMATION REQUISE**\nRéagissez à ce message pour valider le préfixe : [ ${newPrefix} ]\n${chatDeco}`,
			(err, info) => {
				formSet.messageID = info.messageID;
				global.GoatBot.onReaction.set(info.messageID, formSet);
			}
		);
	},

	onReaction: async function ({ message, threadsData, event, Reaction }) {
		const { author, newPrefix, setGlobal } = Reaction;
		if (event.userID !== author) return;
		const chatDeco = "🌹 ════════════════════ 🌹";

		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			
			const imagePath = await generatePrefixCanvas(author, "Global Config", newPrefix, "Réseau global mis à jour", null, "GLOBAL");
			return message.reply({
				body: `${chatDeco}\n🌐 **PRÉFIXE GLOBAL CONFIGURÉ**\nNouveau préfixe : [ ${newPrefix} ]\n${chatDeco}`,
				attachment: fs.createReadStream(imagePath)
			}, () => {
				if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
			});
		} else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			
			const imagePath = await generatePrefixCanvas(author, "Local Config", newPrefix, "Ce groupe uniquement", null, "LOCAL");
			return message.reply({
				body: `${chatDeco}\n📌 **PRÉFIXE LOCAL CONFIGURÉ**\nNouveau préfixe du groupe : [ ${newPrefix} ]\n${chatDeco}`,
				attachment: fs.createReadStream(imagePath)
			}, () => {
				if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
			});
		}
	},

	onChat: async function ({ event, message }) {
		if (event.body && event.body.toLowerCase() === "prefix") {
			const uid = event.senderID;
			const chatDeco = "🌹 ════════════════════ 🌹";
			const sysPrefix = global.GoatBot.config.prefix;
			const groupPrefix = utils.getPrefix(event.threadID);

			const imagePath = await generatePrefixCanvas(uid, "Core System", groupPrefix, `Global : [ ${sysPrefix} ]`, null, "ACTIVE");

			return message.reply({
				body: `${chatDeco}\n⚙️ **PRÉFIXE DU GROUPE :** [ ${groupPrefix} ]\n🌍 **PRÉFIXE GLOBAL :** [ ${sysPrefix} ]\n${chatDeco}`,
				attachment: fs.createReadStream(imagePath)
			}, () => {
				if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
			});
		}
	}
};
