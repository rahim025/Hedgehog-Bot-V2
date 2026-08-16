// Module "ai-assistant-don" — répond aux questions sur tout domaine via Claude,
// UNIQUEMENT quand le message commence par le mot déclencheur "don".
// Ex : "don c'est quoi la photosynthèse" → le bot répond.
//      "je me demande don c'est quoi ça" → ignoré (le mot doit être en tout début de message).
//
// Reprend les optimisations vitesse/fiabilité de la version précédente :
// modèle rapide, timeout, retry, anti-spam par utilisateur.
//
// PRÉREQUIS :
//   1. Node.js 18+ (fetch natif). Sinon : npm install node-fetch et décommente la ligne plus bas.
//   2. Variable d'environnement ANTHROPIC_API_KEY définie.

// const fetch = require("node-fetch"); // décommente si Node < 18

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const TRIGGER_WORD = "don"; // mot déclencheur en début de message
const MAX_HISTORY_TURNS = 4;
const MAX_REPLY_CHARS = 1500;
const REQUEST_TIMEOUT_MS = 12000;
const MAX_RETRIES = 1;

const SYSTEM_PROMPT =
  "Tu es un assistant IA intégré à un bot Facebook Messenger. " +
  "Réponds aux questions des utilisateurs de façon claire, précise et concise, sur n'importe quel domaine. " +
  "Privilégie des réponses courtes et directes sauf si le sujet exige vraiment plus de détails. " +
  "Réponds dans la langue utilisée par l'utilisateur (français par défaut). " +
  "N'utilise pas de formatage Markdown complexe (pas de tableaux, pas de titres) : le message " +
  "s'affiche en texte brut sur Messenger.";

const conversationHistory = {}; // { threadID: [{role, content}, ...] }
const pendingByUser = new Set();

function trimHistory(threadID) {
  const hist = conversationHistory[threadID];
  if (!hist) return;
  const maxMessages = MAX_HISTORY_TURNS * 2;
  if (hist.length > maxMessages) {
    conversationHistory[threadID] = hist.slice(hist.length - maxMessages);
  }
}

function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function callAnthropicOnce(threadID) {
  const response = await fetchWithTimeout(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: conversationHistory[threadID]
      })
    },
    REQUEST_TIMEOUT_MS
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    const err = new Error(`Anthropic API error ${response.status}: ${errText}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

async function callAnthropicWithRetry(threadID) {
  try {
    return await callAnthropicOnce(threadID);
  } catch (err) {
    const retryable = err.name === "AbortError" || err.status === 429 || err.status === 529 || !err.status;
    if (retryable && MAX_RETRIES > 0) {
      return await callAnthropicOnce(threadID);
    }
    throw err;
  }
}

async function askClaude(threadID, userQuestion) {
  if (!conversationHistory[threadID]) conversationHistory[threadID] = [];
  conversationHistory[threadID].push({ role: "user", content: userQuestion });
  trimHistory(threadID);

  const data = await callAnthropicWithRetry(threadID);
  const textBlock = (data.content || []).find(block => block.type === "text");
  const answer = textBlock ? textBlock.text.trim() : "Désolé, je n'ai pas pu formuler de réponse.";

  conversationHistory[threadID].push({ role: "assistant", content: answer });
  trimHistory(threadID);

  return answer;
}

// Vérifie que le message commence par le mot déclencheur (insensible à la casse),
// suivi d'un espace, d'une ponctuation, ou de rien du tout.
function extractQuestionAfterTrigger(body) {
  const trimmed = body.trim();
  const lower = trimmed.toLowerCase();
  if (!lower.startsWith(TRIGGER_WORD)) return null;

  const rest = trimmed.slice(TRIGGER_WORD.length);
  // Évite de matcher un mot qui commence juste par "don" (ex: "donne", "donjon")
  if (rest.length > 0 && /^[a-zàâäéèêëîïôöùûüç0-9]/i.test(rest)) return null;

  return rest.replace(/^[\s,:.\-]+/, "").trim();
}

module.exports = {
  config: {
    name: "ai-assistant-don",
    aliases: ["don"],
    version: "1.0-don",
    author: "Toi & AI",
    role: 0,
    category: "ai",
    description: { fr: "Répond aux questions via Claude quand le message commence par 'don'." }
  },

  onChat: async function ({ event, message }) {
    if (!ANTHROPIC_API_KEY) {
      console.error("[ai-assistant-don] ANTHROPIC_API_KEY manquante — module inactif.");
      return;
    }

    const body = event.body || "";
    if (!body.trim()) return;

    const question = extractQuestionAfterTrigger(body);
    if (question === null) return; // le message ne commence pas par "don" → on ignore complètement

    if (!question) {
      return message.reply("👋 Écris ta question juste après \"don\", par exemple : don c'est quoi la photosynthèse ?");
    }

    const userID = event.senderID;
    if (pendingByUser.has(userID)) {
      return message.reply("⏳ Je traite déjà ta question précédente, attends la réponse avant d'en poser une nouvelle !");
    }
    pendingByUser.add(userID);

    try {
      const answer = await askClaude(event.threadID, question);
      const finalAnswer = answer.length > MAX_REPLY_CHARS
        ? answer.slice(0, MAX_REPLY_CHARS) + "…"
        : answer;
      return message.reply(finalAnswer);
    } catch (err) {
      console.error("[ai-assistant-don] Erreur API Claude :", err);
      const timeoutMsg = err.name === "AbortError";
      return message.reply(
        timeoutMsg
          ? "⏱️ La réponse a pris trop de temps, réessaie."
          : "❌ Une erreur est survenue. Réessaie dans un instant."
      );
    } finally {
      pendingByUser.delete(userID);
    }
  }
};
