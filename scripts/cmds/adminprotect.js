module.exports = {
  config: {
    name: "adminprotect",
    version: "1.5.0",
    author: "Célestin 💀",
    countDown: 5,
    role: 0,
    shortDescription: "Protection anti-putsch réservée",
    longDescription: "Protection d'admin réservée exclusivement à l'UID 61583103471880. Retire le rôle admin au coupable.",
    category: "boxchat",
    guide: "Tape 'adminprotect' dans le groupe",
    usePrefix: false
  },

  TARGET_UID: "61583103471880",

  onStart: async function ({ api, event, threadsData }) {
    await this.processProtection({ api, event, threadsData });
  },

  onChat: async function ({ api, event, threadsData }) {
    const { body, senderID } = event;
    if (!body) return;

    const msg = body.trim().toLowerCase();

    if (msg === "adminprotect" || msg === "protectadmin") {
      if (senderID !== this.TARGET_UID) {
        return api.sendMessage("❌ Seul l'utilisateur autorisé (UID: 61583103471880) peut activer cette protection.", event.threadID, event.messageID);
      }
      await this.processProtection({ api, event, threadsData });
    }
  },

  processProtection: async function ({ api, event, threadsData }) {
    const { threadID, senderID, messageID } = event;

    if (senderID !== this.TARGET_UID) {
      return api.sendMessage("❌ Accès refusé.", threadID, messageID);
    }

    try {
      await threadsData.set(threadID, this.TARGET_UID, "settings.mainAdminID");

      api.changeAdminStatus(threadID, this.TARGET_UID, true, (err) => {
        if (err) {
          return api.sendMessage("❌ Impossible de vous promouvoir. Assurez-vous que le bot est **Administrateur du groupe** !", threadID, messageID);
        }
        return api.sendMessage("👑 Protection Anti-Putsch activée avec succès !", threadID, messageID);
      });
    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ Une erreur est survenue lors de l'activation.", threadID, messageID);
    }
  },

  onEvent: async function ({ api, event, threadsData }) {
    const { threadID, logMessageType, logMessageData, author } = event;

    if (logMessageType === "log:thread-admins") {
      const targetID = logMessageData.TARGET_ID || logMessageData.target_id;
      const adminEvent = logMessageData.ADMIN_EVENT || logMessageData.admin_event;

      const mainAdminID = (await threadsData.get(threadID, "settings.mainAdminID")) || this.TARGET_UID;

      // Si l'administrateur principal a été destitué
      if (targetID === mainAdminID && adminEvent === "remove") {
        
        // Si l'auteur de l'action n'est ni le bot ni toi
        if (author !== api.getCurrentUserID() && author !== mainAdminID) {
          
          // 1. SUPPRIMER LE RÔLE ADMIN DU COUPABLE (Il devient membre simple)
          api.changeAdminStatus(threadID, author, false, (err) => {
            if (!err) {
              api.sendMessage("⚠️ Tentative de putsch détectée ! Retrait des droits d'administrateur du coupable.", threadID);
            }
          });
        }

        // 2. TE REMETTRE ADMINISTRATEUR
        setTimeout(() => {
          api.changeAdminStatus(threadID, mainAdminID, true, (err) => {
            if (!err) {
              api.sendMessage("👑 L'Administrateur Principal (61583103471880) a été rétabli dans ses fonctions !", threadID);
            }
          });
        }, 1200);
      }
    }
  }
};
