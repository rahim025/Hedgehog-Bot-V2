module.exports = {
  config: {
    name: "bio",
    version: "1.0.0",
    author: "TonNom",
    countDown: 10,
    role: 2, // Restreint aux administrateurs du bot pour éviter les abus
    shortDescription: "Modifie la bio Facebook du bot",
    longDescription: "Permet de changer directement la biographie affichée sur le profil Facebook du compte du bot.",
    category: "admin",
    guide: "{pn} <nouveau texte de bio>"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const newBio = args.join(" ");

    if (!newBio) {
      return api.sendMessage("⚠️ Indique le texte à afficher sur le profil du bot.\nExemple : !bio Bot officiel Facebook | Dispo 24/7", threadID, messageID);
    }

    // Appel de la méthode de l'API Facebook pour changer la bio du compte
    api.changeBio(newBio, (err) => {
      if (err) {
        return api.sendMessage("❌ Impossible de modifier la biographie du compte Facebook. Vérifie les permissions ou réessaye plus tard.", threadID, messageID);
      }

      return api.sendMessage(`✅ La biographie du profil Facebook a été mise à jour avec succès :\n\n"${newBio}"`, threadID, messageID);
    });
  }
};
