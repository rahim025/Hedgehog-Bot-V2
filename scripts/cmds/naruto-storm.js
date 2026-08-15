const characters = [
  { name: "ʚʆɞ𝕔é𝕝𝕖𝕤𝕥𝕚𝕟 𝕥𝕙𝗲 𝕜𝕚𝕟げるʚʆɞ ネ", power: 89, basic: "pouvoir de Mark Zuckerberg", ultimate: " attaque +coup Géant 🌪️" },
  { name: "Naruto (Mode Ermite)", power: 60, basic: "Rasengan Géant 🌪️", ultimate: "Futon Rasenshuriken 🌪️💨" },
  { name: "Naruto (Rikudo)", power: 70, basic: "Orbe Truth Seeker ⚫", ultimate: "Bijuu Mode Rasenshuriken 🦊🌪️" },
  { name: "Naruto (Baryon Mode)", power: 85, basic: "Punch Ultra Rapide ⚡", ultimate: "Explosion Chakra Nucléaire ☢️" },
  { name: "Sasuke Uchiha", power: 60, basic: "Chidori ⚡", ultimate: "Kirin ⚡🌩️" },
  { name: "Sasuke (Taka)", power: 65, basic: "Chidori Nagashi ⚡💧", ultimate: "Susano'o 💀" },
  { name: "Sasuke (Rinnegan)", power: 70, basic: "Amaterasu 🔥", ultimate: "Indra's Arrow ⚡🏹" },
  { name: "Kakashi Hatake", power: 60, basic: "Raikiri ⚡", ultimate: "Kamui 🌀" },
  { name: "Kakashi (DMS)", power: 75, basic: "Kamui Raikiri ⚡🌀", ultimate: "Susano'o Parfait 💠" },
  { name: "Minato Namikaze", power: 80, basic: "Hiraishin Rasengan ⚡🌀", ultimate: "Mode Kyuubi 🦊" },
  { name: "Hashirama Senju", power: 70, basic: "Foret Naissante 🌳", ultimate: "Art Senin 🌿" },
  { name: "Tobirama Senju", power: 60, basic: "Suiton: Dragon 🌊", ultimate: "Edo Tensei ⚰️" },
  { name: "Tsunade", power: 60, basic: "Coup Surprenant 💥", ultimate: "Sceau Byakugō 💎" },
  { name: "Hiruzen Sarutobi", power: 65, basic: "5 Éléments 🌍🔥💧🌪️⚡", ultimate: "Shinimagi Seal ☠️" },
  { name: "Pain (Tendo)", power: 68, basic: "Shinra Tensei ⬇️", ultimate: "Chibaku Tensei ⬆️" },
  { name: "Itachi Uchiha", power: 70, basic: "Tsukuyomi 🌙", ultimate: "Amaterasu + Susano'o 🔥💀" },
  { name: "Madara (Rikudo)", power: 85, basic: "Truth Seeker Orbs ⚫", ultimate: "Infinite Tsukuyomi 🌙" },
  { name: "Obito Uchiha", power: 70, basic: "Kamui 🌀", ultimate: "Jūbi Mode 🔥" },
  { name: "Kaguya Otsutsuki", power: 78, basic: "Portail Dimensionnel 🌀", ultimate: "Os Cendré + Expansion Divine ☄️" },
  { name: "Boruto (Karma)", power: 75, basic: "Rasengan Spatial 🌌", ultimate: "Pouvoir Otsutsuki 🌙" },
  { name: "Kawaki", power: 70, basic: "Transformation Morpho ⚔️", ultimate: "Karma Full Power 💀" },
  { name: "Isshiki Otsutsuki", power: 90, basic: "Sukunahikona 🔍", ultimate: "Daikokuten ⏳" }
];

const damageSystem = {
  basic: { min: 8, max: 15, chakraCost: 0 },
  special: { min: 15, max: 25, chakraCost: 20 },
  ultimate: { min: 30, max: 45, chakraCost: 75, failChance: 0.3 },
  charge: { chakraGain: 25 }
};

function makeProgressBar(value, max, charFull, charEmpty) {
  const size = 10;
  const filledCount = Math.round((Math.max(0, value) / max) * size);
  const emptyCount = size - filledCount;
  return charFull.repeat(filledCount) + charEmpty.repeat(emptyCount);
}

const gameState = {};

module.exports = {
  config: { 
    name: "naruto-storm", 
    aliases: ["storm", "ns"],
    version: "6.0-Legend",
    author: "Delfa x NeoKEX x Célestin & AI",
    role: 0,
    category: "game",
    description: { fr: "Combat Naruto légendaire, rapide et entièrement basé sur le texte." }
  },

  onStart: async function ({ message, event }) {
    const threadID = event.threadID;
    gameState[threadID] = {
      step: "waiting_start", players: {}, turn: null, p1Character: null, p2Character: null,
      p1HP: 100, p2HP: 100, p1Chakra: 100, p2Chakra: 100, chakraRegen: 5, defending: false
    };

    return message.reply("📜 ━━━ 𝗟𝗔 𝗟É𝗚𝗘𝗡𝗗𝗘 𝗗𝗘𝗦 𝗦𝗛𝗜𝗡𝗢𝗕𝗜𝗦 ━━━\n\nL'arène des ombres attend ses combattants légendaires.\nEnvoyez **start** pour inscrire votre nom dans l'histoire !");
  },

  onChat: async function ({ event, message, usersData }) {
    const threadID = event.threadID; const userID = event.senderID; const body = event.body.toLowerCase().trim();
    if (!gameState[threadID]) return; const state = gameState[threadID];

    if (state.step !== "waiting_start" && state.step !== "choose_p1" && state.step !== "choose_p2" && 
        userID !== state.players.p1 && userID !== state.players.p2) return;

    if (body === 'fin') {
      delete gameState[threadID];
      return message.reply("🔄 La chronique s'interrompt. Le destin des combattants a été réinitialisé.");
    }

    if (state.step === "waiting_start" && body === "start") {
      state.step = "choose_p1"; state.players.p1 = userID;
      return message.reply("🧙 **Le premier prétendant s'avance !**\nTapez **p1** pour confirmer votre présence sur le champ de bataille.");
    }

    if (state.step === "choose_p1" && body === 'p1') {
      if (userID !== state.players.p1) return;
      state.step = "choose_p2";
      return message.reply("🧝 **L'arène gronde...**\nQue le second combattant envoie **p2** pour sceller le duel !");
    }

    if (state.step === "choose_p2" && body === 'p2') {
      if (userID === state.players.p1) return message.reply("❌ Une ombre ne peut pas s'affronter elle-même !");
      state.players.p2 = userID; state.step = "choose_characters_p1";
      
      let characterList = "🎭 ━━━ 𝗟𝗘𝗦 𝗚𝗥𝗔𝗡𝗗𝗦 𝗛É𝗥𝗢𝗦 ━━━\n\n";
      characterList += characters.map((char, i) => `📖 ${i + 1}. **${char.name}** [Puissance: ${char.power}★]`).join("\n");
      
      const p1Name = (await usersData.get(state.players.p1)).name;
      return message.reply(`${characterList}\n\n@${p1Name} **Joueur 1**, écrivez le numéro de la légende que vous souhaitez incarner !`);
    }

    if (state.step.startsWith("choose_characters")) {
      const index = parseInt(body) - 1;
      if (isNaN(index) || index < 0 || index >= characters.length) return message.reply("❌ Cette légende n'existe pas dans nos parchemins.");

      if (state.step === "choose_characters_p1" && userID === state.players.p1) {
        state.p1Character = characters[index]; state.step = "choose_characters_p2";
        const p2Name = (await usersData.get(state.players.p2)).name;
        return message.reply(`✨ **${state.p1Character.name}** s'allie au Joueur 1.\n\n@${p2Name} **Joueur 2**, à votre tour d'invoquer votre guerrier !`);
      }

      if (state.step === "choose_characters_p2" && userID === state.players.p2) {
        state.p2Character = characters[index]; state.turn = "p1"; state.step = "battle";
        
        const p1Name = (await usersData.get(state.players.p1)).name;
        
        const welcomeBattle = `⚔️ ━━━ 𝗟𝗘 𝗖𝗛𝗢𝗖 𝗗𝗘𝗦 𝗘𝗠𝗣𝗜𝗥𝗘𝗦 ━━━\n\n` +
          `🔥 **${state.p1Character.name}** défi publiquement **${state.p2Character.name}** !\n\n` +
          `🎮 **ACTIONS POSSIBLES :**\n` +
          `» **a** : Assaut Basique (0 Chakra)\n` +
          `» **b** : Jutsu Spécial (-20 Chakra)\n` +
          `» **x** : Technique Ultime (-75 Chakra)\n` +
          `» **c** : Canaliser le Chakra (+25 Chakra)\n` +
          `» **d** : Garde Impériale (Bloque les dégâts)\n\n` +
          `👉 @${p1Name}, le premier coup vous appartient !`;
        return message.reply({ body: welcomeBattle, mentions: [{ tag: `@${p1Name}`, id: state.players.p1 }] });
      }
      return;
    }

    if (state.step === "battle") {
      const currentPlayer = state.turn === "p1" ? state.players.p1 : state.players.p2;
      if (userID !== currentPlayer) return;

      const attacker = state.turn === "p1" ? state.p1Character : state.p2Character;
      const defender = state.turn === "p1" ? state.p2Character : state.p1Character;
      const hpKey = state.turn === "p1" ? "p2HP" : "p1HP";
      const chakraKey = state.turn === "p1" ? "p1Chakra" : "p2Chakra";

      let damage = 0; let tech = "Attaque physique standard"; let chakraUsed = 0; let missed = false;

      switch (body) {
        case 'a':
          damage = Math.floor(Math.random() * (damageSystem.basic.max - damageSystem.basic.min + 1)) + damageSystem.basic.min;
          break;
        case 'b':
          if (state[chakraKey] < damageSystem.special.chakraCost) { 
            return message.reply("❌ Vos réserves de Chakra sont insuffisantes pour lancer ce Jutsu !"); 
          } 
          damage = Math.floor(Math.random() * (damageSystem.special.max - damageSystem.special.min + 1)) + damageSystem.special.min;
          chakraUsed = damageSystem.special.chakraCost; 
          tech = attacker.basic;
          break;
        case 'x':
          if (state[chakraKey] < damageSystem.ultimate.chakraCost) { 
            return message.reply("❌ La force de votre esprit réclame plus de Chakra pour cette technique suprême !"); 
          } 
          chakraUsed = damageSystem.ultimate.chakraCost;
          if (Math.random() < damageSystem.ultimate.failChance) { 
            missed = true; 
            tech = `${attacker.ultimate} (Esquivé/Perdu)`; 
          } else {
            damage = Math.floor(Math.random() * (damageSystem.ultimate.max - damageSystem.ultimate.min + 1)) + damageSystem.ultimate.min;
            tech = attacker.ultimate;
          }
          break;
        case 'c':
          state[chakraKey] = Math.min(100, state[chakraKey] + damageSystem.charge.chakraGain);
          state.turn = state.turn === "p1" ? "p2" : "p1";
          state.defending = false;
          const nextNameCharge = (await usersData.get(state.turn === "p1" ? state.players.p1 : state.players.p2)).name;
          return message.reply({
            body: `🔋 **${attacker.name}** concentre ses flux vitaux et récupère +${damageSystem.charge.chakraGain}% de Chakra !\n\n👉 À votre tour, @${nextNameCharge} !`,
            mentions: [{ tag: `@${nextNameCharge}`, id: state.turn === "p1" ? state.players.p1 : state.players.p2 }]
          });
        case 'd':
          state.defending = state.turn; 
          state.turn = state.turn === "p1" ? "p2" : "p1";
          const nextNameGarde = (await usersData.get(state.turn === "p1" ? state.players.p1 : state.players.p2)).name;
          return message.reply({
            body: `🛡️ **${attacker.name}** érige un rempart défensif face à la prochaine tempête !\n\n👉 À votre tour, @${nextNameGarde} !`,
            mentions: [{ tag: `@${nextNameGarde}`, id: state.turn === "p1" ? state.players.p1 : state.players.p2 }]
          });
        default:
          return message.reply("❌ Commande inconnue. Suivez le chemin du guerrier : a, b, x, c, ou d.");
      }

      let logCombat = "";
      if (!missed) {
        if (state.defending && state.defending !== state.turn) { 
          damage = Math.floor(damage * 0.5); 
          logCombat = `🛡️ La garde adverse amortit l'onde de choc !\n💥 **${attacker.name}** déchaîne pourtant : *${tech}* et inflige -${damage}% HP !`;
        } else {
          logCombat = `⚡ **${attacker.name}** passe à l'offensive avec : *${tech}* !\n🎯 Impact dévastateur ! L'adversaire subit -${damage}% HP.`;
        }
        state[chakraKey] -= chakraUsed; 
        state[hpKey] = Math.max(0, state[hpKey] - damage);
      } else {
        logCombat = `💨 L'incroyable technique suprême de **${attacker.name}** (*${tech}*) manque sa cible dans un fracas terrible !`;
        state[chakraKey] = Math.max(0, state[chakraKey] - 10);
      }

      if (state.turn === "p1") state.p1Chakra = Math.min(100, state.p1Chakra + state.chakraRegen);
      else state.p2Chakra = Math.min(100, state.p2Chakra + state.chakraRegen);

      const p1Name = (await usersData.get(state.players.p1)).name;
      const p2Name = (await usersData.get(state.players.p2)).name;

      const p1HpBar = makeProgressBar(state.p1HP, 100, "❤️", "🖤");
      const p2HpBar = makeProgressBar(state.p2HP, 100, "❤️", "🖤");
      const p1ChakraBar = makeProgressBar(state.p1Chakra, 100, "🌀", "⚫");
      const p2ChakraBar = makeProgressBar(state.p2Chakra, 100, "🌀", "⚫");

      let battleLog = `📖 ━━━━ 𝗟'𝗘𝗖𝗥𝗜𝗧 𝗗𝗨 𝗥𝗢𝗨𝗡𝗗 ━━━━\n\n${logCombat}\n\n` +
        `📊 ━━━━ 𝗘𝗧𝗔𝗧 𝗗𝗘𝗦 𝗙𝗢𝗥𝗖𝗘𝗦 ━━━━\n` +
        `👤 **${p1Name}** • ${state.p1Character.name}\n` +
        `├ HP : ${p1HpBar} (${state.p1HP}%)\n` +
        `└ CHK: ${p1ChakraBar} (${state.p1Chakra}%)\n\n` +
        `👤 **${p2Name}** • ${state.p2Character.name}\n` +
        `├ HP : ${p2HpBar} (${state.p2HP}%)\n` +
        `└ CHK: ${p2ChakraBar} (${state.p2Chakra}%)\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      if (state.p1HP <= 0 || state.p2HP <= 0) {
        const winner = state.p1HP <= 0 ? p2Name : p1Name;
        const winnerCharacter = state.p1HP <= 0 ? state.p2Character.name : state.p1Character.name;
        delete gameState[threadID];
        return message.reply(`${battleLog}🏆 ━━━ 𝗩𝗜𝗖𝗧𝗢𝗜𝗥𝗘 𝗟É𝗚𝗘𝗡𝗗𝗔𝗜𝗥𝗘 ━━━\n\nL'histoire se souviendra du triomphe de **${winner}** combattant sous l'effigie de **${winnerCharacter}** !\n\n_Envoyez 'start' pour rouvrir le livre des légendes._`);
      }

      state.turn = state.turn === "p1" ? "p2" : "p1";
      state.defending = false;
      
      const nextPlayer = state.turn === "p1" ? state.players.p1 : state.players.p2;
      const nextName = (await usersData.get(nextPlayer)).name;
      
      battleLog += `👉 À votre tour, @${nextName} !`;
      return message.reply({ body: battleLog, mentions: [{ tag: `@${nextName}`, id: nextPlayer }] });
    }
  }
};
			  
