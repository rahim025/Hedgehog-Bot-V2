const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs-extra');
const path = require('path');
const GIFEncoder = require('gifencoder');
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

// ==========================================
// 🎨 ENGINE CANVAS ANIMÉ BOMBE EDITION (1000x580)
// ==========================================
async function generatePrefixCanvas(userId, title, prefixText, detailsText, themeColor = "#ff0055", badgeText = "BOOM") {
	const width = 1000;
	const height = 580;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	const charsArray = Array.from(prefixText);
	let framesText = [];

	// Séquence d'animation : Texte progressif -> Explosion Bombe -> Pause Statique
	for (let i = 1; i <= charsArray.length; i++) {
		framesText.push(charsArray.slice(0, i).join(""));
	}
	const fullText = charsArray.join("");
	for (let i = 0; i < 8; i++) {
		framesText.push(fullText);
	}

	const tmpDir = path.join(__dirname, "cache");
	await fs.ensureDir(tmpDir);
	const gifPath = path.join(tmpDir, `prefix_${Date.now()}_${userId}.gif`);

	const encoder = new GIFEncoder(width, height);
	const writeStream = fs.createWriteStream(gifPath);
	encoder.createReadStream().pipe(writeStream);

	encoder.start();
	encoder.setRepeat(0);   
	encoder.setDelay(70); // Animation très rapide & dynamique (70ms)
	encoder.setQuality(15);

	let userAvatar = null;
	const avatarUrl = `https://graph.facebook.com/${userId}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
	
	try {
		const res = await axios.get(avatarUrl, { responseType: 'arraybuffer', timeout: 3000 });
		userAvatar = await loadImage(Buffer.from(res.data));
	} catch (e) {}

	const avatarX = 200;
	const avatarY = 290;
	const radius = 110;

	// Génération de 20 particules d'explosion fixes pour l'animation
	const particles = [];
	for (let p = 0; p < 25; p++) {
		const angle = Math.random() * Math.PI * 2;
		const speed = 5 + Math.random() * 12;
		particles.push({ angle, speed, size: 2 + Math.random() * 5 });
	}

	for (let f = 0; f < framesText.length; f++) {
		ctx.clearRect(0, 0, width, height);

		// Shake effect (Tremblement de carte lors de l'effet bombe)
		const shakeX = (Math.random() - 0.5) * (f > 4 ? 6 : 2);
		const shakeY = (Math.random() - 0.5) * (f > 4 ? 6 : 2);

		ctx.save();
		ctx.translate(shakeX, shakeY);

		// 1. Fond sombre de crise / cyberpunk bombe
		let gradient = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
		gradient.addColorStop(0, '#1a000a');
		gradient.addColorStop(0.6, '#0a0005');
		gradient.addColorStop(1, '#020002');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);

		// 2. Onde de choc d'explosion en arrière-plan
		const waveRadius = (f * 35) % (width / 1.5);
		ctx.strokeStyle = themeColor;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(670, 320, waveRadius, 0, Math.PI * 2);
		ctx.stroke();

		// 3. Cadre Néon Alerte / Bombe
		ctx.strokeStyle = themeColor;
		ctx.lineWidth = 4;
		drawRoundedRect(ctx, 30, 30, width - 60, height - 60, 20);
		ctx.stroke();

		// 4. Anneaux autour de l'avatar avec voyant d'urgence
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
		ctx.lineWidth = 6;
		ctx.beginPath();
		ctx.arc(avatarX, avatarY, radius + 15, 0, Math.PI * 2);
		ctx.stroke();

		// Fragment tournant à grande vitesse
		ctx.strokeStyle = themeColor;
		ctx.lineWidth = 6;
		ctx.beginPath();
		let startAngle = f * 0.5; 
		ctx.arc(avatarX, avatarY, radius + 15, startAngle, startAngle + Math.PI * 0.9);
		ctx.stroke();

		// 5. Particules d'éjection (Éclats de la bombe)
		ctx.fillStyle = themeColor;
		for (let p = 0; p < particles.length; p++) {
			const pt = particles[p];
			const px = 670 + Math.cos(pt.angle) * (f * pt.speed);
			const py = 320 + Math.sin(pt.angle) * (f * pt.speed);
			ctx.beginPath();
			ctx.arc(px, py, pt.size, 0, Math.PI * 2);
			ctx.fill();
		}

		// Rendu Avatar
		if (userAvatar) {
			ctx.save();
			ctx.beginPath();
			ctx.arc(avatarX, avatarY, radius, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(userAvatar, avatarX - radius, avatarY - radius, radius * 2, radius * 2);
			ctx.restore();
		} else {
			ctx.fillStyle = themeColor;
			ctx.beginPath(); 
			ctx.arc(avatarX, avatarY, radius, 0, Math.PI * 2); 
			ctx.fill();
			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 50px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText("💣", avatarX, avatarY + 15);
		}

		// Contour lumineux Avatar
		ctx.strokeStyle = themeColor;
		ctx.lineWidth = 4;
		ctx.beginPath();
		ctx.arc(avatarX, avatarY, radius + 2, 0, Math.PI * 2);
		ctx.stroke();

		// Badge Statut Alerte
		ctx.fillStyle = themeColor;
		drawRoundedRect(ctx, width - 185, 65, 120, 30, 6);
		ctx.fill();

		ctx.fillStyle = '#000000';
		ctx.font = 'bold 12px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText(badgeText.toUpperCase(), width - 125, 85);

		// Textes de gauche
		ctx.textAlign = 'left';
		ctx.fillStyle = '#FFFFFF';
		ctx.font = 'bold 38px sans-serif';
		ctx.fillText(truncateText(ctx, title.toUpperCase(), 450), 420, 115);

		ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
		ctx.font = '16px sans-serif';
		ctx.fillText(truncateText(ctx, detailsText, 450), 420, 155);

		const decoration = "💣 ─── 𝑩𝑶𝑴𝑩 𝑬𝑵𝑮𝑰𝑵𝑬 ─── 💣";

		// Séparateur haut
		ctx.fillStyle = themeColor;
		ctx.font = 'bold 18px sans-serif';
		ctx.fillText(decoration, 420, 215);

		// Rendu du préfixe géant (Effet de détonation)
		ctx.textAlign = 'center';
		ctx.fillStyle = f % 2 === 0 ? '#FFFFFF' : themeColor;
		ctx.font = 'bold 120px sans-serif';
		
		let textToRender = framesText[f] + "💥";
		ctx.fillText(textToRender, 670, 345);

		// Label inférieur clignotant
		ctx.fillStyle = '#FFFFFF';
		ctx.font = 'bold 14px sans-serif';
		ctx.fillText("🔥 SYSTEM TACTICAL DETONATOR 🔥", 670, 395);

		// Séparateur bas
		ctx.textAlign = 'left';
		ctx.fillStyle = themeColor;
		ctx.font = 'bold 18px sans-serif';
		ctx.fillText(decoration, 420, 455);

		// Footer
		ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
		ctx.font = '11px sans-serif';
		ctx.fillText("» ULTRA BOMBER CANVAS EDITION V4.0 «", 420, 510);

		ctx.restore();
		encoder.addFrame(ctx);
	}

	encoder.finish();
	await new Promise((resolve) => writeStream.on('finish', resolve));
	return gifPath;
}

module.exports = {
	config: {
		name: "prefix",
		version: "4.5.0 Bombe",
		author: "NTKhang x Célestin 🔥",
		countDown: 2,
		role: 0,
		description: "Affiche ou modifie le préfixe avec une interface explosive animée",
		category: "config",
		guide: {
			en: "   {pn} <nouveau préfixe>\n   Exemple: {pn} #\n\n   {pn} reset"
		}
	},

	onStart: async function ({ message, role, args, commandName, event, threadsData }) {
		const senderID = event.senderID;
		const chatDeco = "💣 ════════════════════ 💣";

		if (!args[0]) {
			const sysPrefix = global.GoatBot.config.prefix;
			const groupPrefix = utils.getPrefix(event.threadID);
			const imagePath = await generatePrefixCanvas(senderID, "Core System", groupPrefix, `Global : [ ${sysPrefix} ]`, "#ff0055", "BOMBER ON");
			
			return message.reply({
				body: `${chatDeco}\n⚙️ **PRÉFIXE DU GROUPE :** [ ${groupPrefix} ]\n🌍 **PRÉFIXE GLOBAL :** [ ${sysPrefix} ]\n${chatDeco}`,
				attachment: fs.createReadStream(imagePath)
			}, () => {
				setTimeout(() => { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); }, 2000);
			});
		}

		if (args[0] == 'reset') {
			await threadsData.set(event.threadID, null, "data.prefix");
			const defaultPrefix = global.GoatBot.config.prefix;
			const imagePath = await generatePrefixCanvas(senderID, "Reset System", defaultPrefix, "Retour aux réglages usine", "#ff9900", "RESET");
			
			return message.reply({
				body: `${chatDeco}\n🔄 **RÉINITIALISATION REUSSIE**\nPréfixe par défaut : [ ${defaultPrefix} ]\n${chatDeco}`,
				attachment: fs.createReadStream(imagePath)
			}, () => {
				setTimeout(() => { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); }, 2000);
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
			`${chatDeco}\n⚠️ **DETONATEUR EN ATTENTE**\nRéagissez à ce message pour valider le préfixe : [ ${newPrefix} ]\n${chatDeco}`,
			(err, info) => {
				formSet.messageID = info.messageID;
				global.GoatBot.onReaction.set(info.messageID, formSet);
			}
		);
	},

	onReaction: async function ({ message, threadsData, event, Reaction }) {
		const { author, newPrefix, setGlobal } = Reaction;
		if (event.userID !== author) return;
		const chatDeco = "💥 ════════════════════ 💥";

		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			
			const imagePath = await generatePrefixCanvas(author, "Global Config", newPrefix, "Réseau global mis à jour", "#ff0055", "GLOBAL");
			return message.reply({
				body: `${chatDeco}\n🌐 **PRÉFIXE GLOBAL CONFIGURÉ**\nNouveau préfixe : [ ${newPrefix} ]\n${chatDeco}`,
				attachment: fs.createReadStream(imagePath)
			}, () => {
				setTimeout(() => { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); }, 2000);
			});
		} else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			
			const imagePath = await generatePrefixCanvas(author, "Local Config", newPrefix, "Ce groupe uniquement", "#00ffcc", "LOCAL");
			return message.reply({
				body: `${chatDeco}\n📌 **PRÉFIXE LOCAL CONFIGURÉ**\nNouveau préfixe du groupe : [ ${newPrefix} ]\n${chatDeco}`,
				attachment: fs.createReadStream(imagePath)
			}, () => {
				setTimeout(() => { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); }, 2000);
			});
		}
	},

	onChat: async function ({ event, message }) {
		if (event.body && event.body.toLowerCase() === "prefix") {
			const uid = event.senderID;
			const chatDeco = "💥 ════════════════════ 💥";
			const sysPrefix = global.GoatBot.config.prefix;
			const groupPrefix = utils.getPrefix(event.threadID);

			const imagePath = await generatePrefixCanvas(uid, "Core System", groupPrefix, `Global : [ ${sysPrefix} ]`, "#ff0055", "BOMBER ON");

			return message.reply({
				body: `${chatDeco}\n⚙️ **PRÉFIXE DU GROUPE :** [ ${groupPrefix} ]\n🌍 **PRÉFIXE GLOBAL :** [ ${sysPrefix} ]\n${chatDeco}`,
				attachment: fs.createReadStream(imagePath)
			}, () => {
				setTimeout(() => { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); }, 2000);
			});
		}
	}
};
												
