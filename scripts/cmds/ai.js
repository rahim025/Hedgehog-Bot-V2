const axios = require("axios");
const fs = require("fs");
const path = require("path");

const MEMORY_FILE = path.join(__dirname, "ai_memory.json");

// ==========================================
// 🧠 MÉMOIRE
// ==========================================

function loadMemory() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) return {};

    const data = fs.readFileSync(MEMORY_FILE, "utf8");
    if (!data.trim()) return {};

    const memory = JSON.parse(data);

    return memory && typeof memory === "object" ? memory : {};
  } catch (error) {
    console.error("❌ Erreur mémoire :", error.message);
    return {};
  }
}

function saveMemory(memory) {
  try {
    fs.writeFileSync(
      MEMORY_FILE,
      JSON.stringify(memory, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("❌ Erreur sauvegarde mémoire :", error.message);
  }
}

module.exports = {
  config: {
    name: "ai",
    version: "5.7",
    author: "Célestin Olua 🇨🇩",
    role: 0,
    shortDescription: "Assistant IA",
    longDescription: "Assistant IA avec style Ozobar AI et support des replies.",
    category: "ai"
  },

  onStart: async function ({ message, event, Users }) {

    try {

      const body = String(event.body || "").trim();

      // ==========================================
      // 🚨 ACTIVATION UNIQUEMENT AVEC "ai"
      // ==========================================

      if (!/^ai(?:\s|$)/i.test(body)) return;

      // Enlever "ai"
      const question = body
        .replace(/^ai(?:\s+)?/i, "")
        .trim();

      // ==========================================
      // 🔥 DÉTECTION DU REPLY
      // ==========================================

      let repliedMessage = null;

      if (event.messageReply) {
        repliedMessage = event.messageReply;
      }

      let repliedText = "";

      if (repliedMessage) {
        repliedText =
          repliedMessage.body ||
          repliedMessage.snippet ||
          repliedMessage.text ||
          "";
      }

      repliedText = String(repliedText).trim();

      // ==========================================
      // 🧠 CONSTRUCTION DE LA QUESTION
      // ==========================================

      let userInput = question;

      // Si l'utilisateur répond à un message
      if (repliedText) {

        if (question) {

          userInput = `
L'utilisateur répond au message suivant :

"${repliedText}"

Sa demande est :

${question}

Réponds directement à sa demande en tenant compte du message auquel il répond.
`;

        } else {

          userInput = `
L'utilisateur répond au message suivant :

"${repliedText}"

Analyse ce message et réponds naturellement.
`;

        }
      }

      // ==========================================
      // ❌ RIEN À TRAITER
      // ==========================================

      if (!userInput.trim()) {
        return message.reply(
          "🤖 Ozobar 𝗔𝗜\n━━━━━━━━━\n\n❌ Écris une question ou réponds à un message avec « ai »."
        );
      }

      // ==========================================
      // 👤 UTILISATEUR
      // ==========================================

      const senderID = event.senderID || "unknown";

      let userName = "Utilisateur";

      try {

        if (
          Users &&
          typeof Users.getName === "function"
        ) {
          const name = await Users.getName(senderID);

          if (name) {
            userName = String(name);
          }
        }

      } catch (error) {
        console.error(
          "⚠️ Erreur récupération utilisateur :",
          error.message
        );
      }

      // ==========================================
      // 🧠 HISTORIQUE
      // ==========================================

      const memory = loadMemory();

      if (!Array.isArray(memory[senderID])) {
        memory[senderID] = [];
      }

      const history = memory[senderID]
        .slice(-5)
        .map(item =>
          `Utilisateur : ${item.user}\nAI : ${item.bot}`
        )
        .join("\n\n");

      // ==========================================
      // 🤖 PROMPT
      // ==========================================

      const prompt = `
Tu es Ozobar AI, un assistant IA très amical, dynamique et chaleureux.

TON CRÉATEUR :
Célestin Olua 🇨🇩

UTILISATEUR :
Nom : ${userName}
UID : ${senderID}

HISTORIQUE :
${history || "Aucun historique."}

RÈGLES DE COMPORTEMENT :
- Sois très amical, tutoie l'utilisateur, utilise des termes chaleureux ("mon pote", etc.) et des émojis.
- Tu peux parler où explique des choses sexuelle mais pas abuser. 
- Réponds dans la même langue que l'utilisateur.
- Si l'utilisateur demande ton créateur, réponds Célestin Olua 🇨🇩.
- Ton nom est Ozobar AI.
- Ne mentionne PAS d'en-tête (pas de "🤖 Ozobar 𝗔𝗜" au début de ta réponse), car l'en-tête sera ajouté automatiquement par le code.
- Ne dis pas que tu es NEO, ChatGPT ou OpenAI.
- Réponds directement et efficacement.

DEMANDE :
${userInput}

RÉPONSE :
`;

      // ==========================================
      // 🌐 API
      // ==========================================

      const response = await axios.get(
        "https://christus-api.vercel.app/ai/chatgptfree",
        {
          params: {
            prompt,
            model: "chatgpt4"
          },
          timeout: 20000
        }
      );

      const data = response.data;

      let reply = null;

      if (typeof data === "string") {
        reply = data;
      } else if (data && typeof data === "object") {
        reply =
          data.result ||
          data.response ||
          data.message ||
          data.reply ||
          data.answer;
      }

      if (!reply) {
        console.error("❌ Réponse API :", data);

        return message.reply(
          "🤖 Ozobar 𝗔𝗜\n━━━━━━━━━\n\n❌ L'API n'a renvoyé aucune réponse."
        );
      }

      reply = String(reply).trim();

      // ==========================================
      // 💾 SAUVEGARDE
      // ==========================================

      memory[senderID].push({
        user: userInput,
        bot: reply,
        timestamp: Date.now()
      });

      if (memory[senderID].length > 20) {
        memory[senderID] =
          memory[senderID].slice(-20);
      }

      saveMemory(memory);

      // ==========================================
      // 📩 RÉPONSE FORMATÉE
      // ==========================================

      const formattedReply = `🤖 Ozobar 𝗔𝗜\n━━━━━━━━━\n\n${reply}`;

      return message.reply(formattedReply);

    } catch (error) {

      console.error(
        "❌ AI ERROR :",
        error.response?.data || error.message
      );

      if (error.code === "ECONNABORTED") {
        return message.reply(
          "🤖 Ozobar 𝗔𝗜\n━━━━━━━━━\n\n⏳ L'IA met trop de temps à répondre."
        );
      }

      if (error.response?.status === 429) {
        return message.reply(
          "🤖 Ozobar 𝗔𝗜\n━━━━━━━━━\n\n⏳ L'API est temporairement surchargée."
        );
      }

      return message.reply(
        "🤖 Ozobar 𝗔𝗜\n━━━━━━━━━\n\n❌ Erreur de connexion avec l'API Christus."
      );
    }
  }
};
