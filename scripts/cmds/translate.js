const axios = require('axios');

// Fonction de traduction via l'API Google Translate
async function translate(text, langCode) {
    const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`);
    return {
        text: res.data[0].map(item => item[0]).join(''),
        lang: res.data[2]
    };
}

module.exports = {
    config: {
        name: "translate",
        aliases: ["trans", "trad"],
        version: "4.0",
        author: "NTKhang x Célestin",
        countDown: 3,
        role: 0,
        usePrefix: false, // MODE SANS PRÉFIXE ACTIVÉ
        category: "utility",
        shortDescription: "Traduit un texte directement en message texte"
    },

    onStart: async function ({ message, event, args, threadsData }) {
        let content;
        let langCodeTrans;
        const langOfThread = await threadsData.get(event.threadID, "data.lang") || "fr";

        // Récupération du contenu depuis une réponse à un message ou depuis les arguments
        if (event.messageReply) {
            content = event.messageReply.body;
            langCodeTrans = args[0] && args[0].length <= 3 ? args[0] : langOfThread;
        } else {
            content = args.join(" ");
            let sep = content.lastIndexOf("->");
            if (sep !== -1) {
                langCodeTrans = content.slice(sep + 2).trim();
                content = content.slice(0, sep).trim();
            } else {
                langCodeTrans = langOfThread;
            }
        }

        if (!content) return message.reply("⚠️ Veuillez entrer ou répondre à un texte valide à traduire.");

        try {
            const { text, lang } = await translate(content.trim(), langCodeTrans.trim());
            
            const msg = `🌐 [ 𝓣𝓡𝓐𝓓𝓤𝓒𝓣𝓘𝓞𝓝 ] 🌐\n\n` +
                        `🔤 Langue détectée : ${lang.toUpperCase()}\n` +
                        `🎯 Cible : ${langCodeTrans.toUpperCase()}\n` +
                        `───────────────\n` +
                        `📝 Résultat :\n${text}`;

            return message.reply(msg);
        } catch (err) {
            console.error(err);
            return message.reply("⚠️ Une erreur est survenue lors de la traduction du texte.");
        }
 
	}
};
