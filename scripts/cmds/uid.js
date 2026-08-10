const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

module.exports = {
	config: {
		name: "uid",
		version: "3.2",
		author: "Modifié x Célestin",
		countDown: 5,
		role: 0,
		usePrefix: false, // MODE SANS PRÉFIXE ACTIVÉ
		description: {
			vi: "Xem user id và tên bằng ảnh canvas",
			en: "View facebook user id and name with a canvas image"
		},
		category: "info",
		guide: {
			vi: "   {pn}: xem uid de bạn\n   {pn} @tag: xem uid người được tag",
			en: "   {pn}: view your uid\n   {pn} @tag: view tagged user's uid"
		}
	},

	onStart: async function ({ message, event, args, usersData }) {
		let targetID = event.senderID;
		let targetName = "USER_OPERATOR";

		// Détermination de la cible et extraction du nom
		if (event.messageReply) {
			targetID = event.messageReply.senderID;
		} else if (Object.keys(event.mentions).length > 0) {
			targetID = Object.keys(event.mentions)[0];
		} else if (args[0] && !isNaN(args[0])) {
			targetID = args[0];
		}

		// Récupération dynamique du nom réel de l'utilisateur
		if (usersData && usersData.getName) {
			try {
				const fetchedName = await usersData.getName(targetID);
				if (fetchedName) targetName = fetchedName.toUpperCase();
			} catch (e) {
				// Utilisation du nom par défaut si échec
			}
		}

		const avatarURL = `https://graph.facebook.com/${targetID}/picture?width=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
		const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/png?seed=${targetID}`;

		try {
			// Canvas format large
			const canvas = createCanvas(850, 350);
			const ctx = canvas.getContext('2d');

			// --- FOND CYBER ROBOT ---
			ctx.fillStyle = "#0a0a0c"; 
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Grille techno
			ctx.strokeStyle = "rgba(0, 110, 255, 0.05)";
			ctx.lineWidth = 2;
			for (let i = 0; i < canvas.width; i += 40) {
				ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
			}
			for (let j = 0; j < canvas.height; j += 40) {
				ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
			}

			// Cadre HUD robot
			ctx.strokeStyle = "#0055ff";
			ctx.lineWidth = 4;
			ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
			
			// Coins renforcés cyber
			ctx.fillStyle = "#00d4ff";
			ctx.fillRect(15, 15, 20, 6);   ctx.fillRect(15, 15, 6, 20);
			ctx.fillRect(815, 15, 20, 6);  ctx.fillRect(829, 15, 6, 20);
			ctx.fillRect(15, 329, 20, 6);  ctx.fillRect(15, 315, 6, 20);
			ctx.fillRect(815, 329, 20, 6); ctx.fillRect(829, 315, 6, 20);

			// Chargement Avatar via Buffer / Axios pour garantir la stabilité
			let avatarImage;
			try {
				const res = await axios.get(avatarURL, { responseType: 'arraybuffer', timeout: 4000 });
				avatarImage = await loadImage(Buffer.from(res.data));
			} catch (error) {
				try {
					const fallbackRes = await axios.get(fallbackAvatar, { responseType: 'arraybuffer', timeout: 4000 });
					avatarImage = await loadImage(Buffer.from(fallbackRes.data));
				} catch (err) {
					// Alternative si échec réseau total
					const dummyCanvas = createCanvas(230, 200);
					const dummyCtx = dummyCanvas.getContext('2d');
					dummyCtx.fillStyle = '#0055ff';
					dummyCtx.fillRect(0, 0, 230, 200);
					avatarImage = dummyCanvas;
				}
			}

			// Masque Octogonal Cyber
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(70, 175);
			ctx.lineTo(135, 75);
			ctx.lineTo(235, 75);
			ctx.lineTo(300, 175);
			ctx.lineTo(235, 275);
			ctx.lineTo(135, 275);
			ctx.closePath();
			
			ctx.lineWidth = 5;
			ctx.strokeStyle = "#00d4ff";
			ctx.stroke();
			ctx.clip();
			ctx.drawImage(avatarImage, 70, 75, 230, 200);
			ctx.restore();

			// --- TEXTES INTERFACE ---
			
			// Tag système du haut
			ctx.font = "11px sans-serif";
			ctx.fillStyle = "rgba(0, 212, 255, 0.6)";
			ctx.fillText("SYSTEM // IDENTITY_DATA_CORE", 350, 85);

			// AFFICHAGE DU NOM (En gros, style robotique blanc)
			ctx.font = "bold 34px sans-serif";
			ctx.fillStyle = "#ffffff";
			const cleanName = targetName.length > 18 ? targetName.substring(0, 16) + "..." : targetName;
			ctx.fillText(cleanName, 350, 135);

			// Séparateur tech
			ctx.strokeStyle = "rgba(0, 85, 255, 0.3)";
			ctx.lineWidth = 2;
			ctx.beginPath(); ctx.moveTo(350, 155); ctx.lineTo(780, 155); ctx.stroke();

			// Label UID
			ctx.font = "12px sans-serif";
			ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
			ctx.fillText("SECURE_ACCESS_ID:", 350, 185);

			// Valeur UID
			ctx.font = "bold 36px sans-serif";
			ctx.fillStyle = "#00d4ff"; 
			ctx.fillText(`> ${targetID}`, 350, 230);

			// Barre de statut du bas
			ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
			ctx.fillRect(350, 265, 450, 6);
			ctx.fillStyle = "#0055ff";
			ctx.fillRect(350, 265, 380, 6); 

			// Exportation du fichier temporaire
			const tmpDir = path.join(__dirname, 'cache');
			await fs.ensureDir(tmpDir);
			const pathImg = path.join(tmpDir, `uid_${Date.now()}_${targetID}.png`);
			await fs.outputFile(pathImg, canvas.toBuffer('image/png'));

			return message.reply({
				body: `🌐 [ RÉSULTAT DU SCAN ] Données extraites avec succès.\n🆔 UID : ${targetID}`,
				attachment: fs.createReadStream(pathImg)
			}, () => {
				if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
			});

		} catch (error) {
			console.error(error);
			return message.reply(`❌ Erreur système : ${error.message}`);
		}
	}
};
