/**
 * @author NTKhang & Célestin
 * ! GoatBot V2 - Edition Célestin (Version Stabilité Longue Durée)
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 */

// ———————————————— GESTION CRITIQUE DES ERREURS (ANTI-CRASH) ———————————————— //
process.on('unhandledRejection', (error) => {
  console.log('🔹 [Célestin Error Handler - Anti-Crash Rejection]', error?.stack || error);
});

process.on('uncaughtException', (error) => {
  console.log('🔹 [Célestin Error Handler - Anti-Crash Exception]', error?.stack || error);
});

const axios = require("axios");
const fs = require("fs-extra");
const google = require("googleapis").google;
const nodemailer = require("nodemailer");
const { execSync } = require('child_process');
const log = require('./logger/log.js');
const path = require("path");

process.env.BLUEBIRD_W_FORGOTTEN_RETURN = 0;

function validJSON(pathDir) {
  try {
    if (!fs.existsSync(pathDir)) throw new Error(`File "${pathDir}" not found`);
    execSync(`npx jsonlint "${pathDir}"`, { stdio: 'pipe' });
    return true;
  } catch (err) {
    let msgError = err.message;
    msgError = msgError.split("\n").slice(1).join("\n");
    const indexPos = msgError.indexOf("    at");
    msgError = msgError.slice(0, indexPos !== -1 ? indexPos - 1 : msgError.length);
    throw new Error(msgError);
  }
}

const { NODE_ENV } = process.env;
const dirConfig = path.normalize(`${__dirname}/config${['production', 'development'].includes(NODE_ENV) ? '.dev.json' : '.json'}`);
const dirConfigCommands = path.normalize(`${__dirname}/configCommands${['production', 'development'].includes(NODE_ENV) ? '.dev.json' : '.json'}`);
const dirAccount = path.normalize(`${__dirname}/account${['production', 'development'].includes(NODE_ENV) ? '.dev.txt' : '.txt'}`);

for (const pathDir of [dirConfig, dirConfigCommands]) {
  try {
    validJSON(pathDir);
  } catch (err) {
    log.error("CÉLESTIN - CONFIG", `Fichier JSON invalide "${pathDir.replace(__dirname, "")}":\n${err.message.split("\n").map(line => `  ${line}`).join("\n")}\nCorrige-le stp !`);
    process.exit(0);
  }
}

const config = require(dirConfig);
if (config.whiteListMode?.whiteListIds && Array.isArray(config.whiteListMode.whiteListIds)) {
  config.whiteListMode.whiteListIds = config.whiteListMode.whiteListIds.map(id => id.toString());
}
const configCommands = require(dirConfigCommands);

global.GoatBot = {
  startTime: Date.now() - process.uptime() * 1000,
  commands: new Map(),
  eventCommands: new Map(),
  commandFilesPath: [],
  eventCommandsFilesPath: [],
  aliases: new Map(),
  onFirstChat: [],
  onChat: [],
  onEvent: [],
  onReply: new Map(),
  onReaction: new Map(),
  onAnyEvent: [],
  config,
  configCommands,
  envCommands: {},
  envEvents: {},
  envGlobal: {},
  reLoginBot: function () { },
  Listening: null,
  oldListening: [],
  callbackListenTime: {},
  storage5Message: [],
  fcaApi: null,
  botID: null
};

global.db = {
  allThreadData: [],
  allUserData: [],
  allDashBoardData: [],
  allGlobalData: [],

  threadModel: null,
  userModel: null,
  dashboardModel: null,
  globalModel: null,

  threadsData: null,
  usersData: null,
  dashBoardData: null,
  globalData: null,

  receivedTheFirstMessage: {}
};

global.client = {
  dirConfig,
  dirConfigCommands,
  dirAccount,
  countDown: {},
  cache: {},
  database: {
    creatingThreadData: [],
    creatingUserData: [],
    creatingDashBoardData: [],
    creatingGlobalData: []
  },
  commandBanned: configCommands.commandBanned
};

const utils = require("./utils.js");
global.utils = utils;
const { colors } = utils;

global.temp = {
  createThreadData: [],
  createUserData: [],
  createThreadDataError: [],
  filesOfGoogleDrive: {
    arraybuffer: {},
    stream: {},
    fileNames: {}
  },
  contentScripts: {
    cmds: {},
    events: {}
  }
};

// Hot-Reload optimisé des configurations (prévention des blocages d'E/S)
const watchAndReloadConfig = (dir, type, prop, logName) => {
  let lastModified = fs.statSync(dir).mtimeMs;
  let isFirstModified = true;

  fs.watch(dir, (eventType) => {
    if (eventType === type) {
      const oldConfig = global.GoatBot[prop];

      setTimeout(() => {
        try {
          if (isFirstModified) {
            isFirstModified = false;
            return;
          }
          const currentMtime = fs.statSync(dir).mtimeMs;
          if (lastModified === currentMtime) {
            return;
          }
          global.GoatBot[prop] = JSON.parse(fs.readFileSync(dir, 'utf-8'));
          log.success(`CÉLESTIN - ${logName}`, `Rechargement réussi de ${dir.replace(process.cwd(), "")} 😏`);
          lastModified = currentMtime;
        } catch (err) {
          log.warn(`CÉLESTIN - ${logName}`, `Impossible de recharger ${dir.replace(process.cwd(), "")}`);
          global.GoatBot[prop] = oldConfig;
        }
      }, 300);
    }
  });
};

watchAndReloadConfig(dirConfigCommands, 'change', 'configCommands', 'CONFIG COMMANDES');
watchAndReloadConfig(dirConfig, 'change', 'config', 'CONFIG');

global.GoatBot.envGlobal = global.GoatBot.configCommands.envGlobal;
global.GoatBot.envCommands = global.GoatBot.configCommands.envCommands;
global.GoatBot.envEvents = global.GoatBot.configCommands.envEvents;

const getText = global.utils.getText;

// ———————————————— REDÉMARRAGE AUTOMATIQUE STABLE ———————————————— //
if (config.autoRestart) {
  const time = config.autoRestart.time;
  if (!isNaN(time) && time > 0) {
    utils.log.info("CÉLESTIN - AUTO RESTART", getText("Goat", "autoRestart1", utils.convertTime(time, true)));
    setTimeout(() => {
      utils.log.info("CÉLESTIN - AUTO RESTART", "Redémarrage en cours... À tout de suite !");
      process.exit(2);
    }, time);
  } else if (typeof time === "string" && time.match(/^((((\d+,)+\d+|(\d+(\/|-|#)\d+)|\d+L?|\*(\/\d+)?|L(-\d+)?|\?|[A-Z]{3}(-[A-Z]{3})?) ?){5,7})$/gmi)) {
    utils.log.info("CÉLESTIN - AUTO RESTART", getText("Goat", "autoRestart2", time));
    const cron = require("node-cron");
    cron.schedule(time, () => {
      utils.log.info("CÉLESTIN - AUTO RESTART", "Redémarrage programmé... Hop !");
      process.exit(2);
    });
  }
}

(async () => {
  // ———————————————— CONFIGURATION MAIL (SÉCURISÉE) ———————————————— //
  if (config.credentials?.gmailAccount?.email) {
    try {
      const { gmailAccount } = config.credentials;
      const { email, clientId, clientSecret, refreshToken } = gmailAccount;
      const OAuth2 = google.auth.OAuth2;
      const OAuth2_client = new OAuth2(clientId, clientSecret);
      OAuth2_client.setCredentials({ refresh_token: refreshToken });

      const accessToken = await OAuth2_client.getAccessToken();

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        service: 'Gmail',
        auth: {
          type: 'OAuth2',
          user: email,
          clientId,
          clientSecret,
          refreshToken,
          accessToken
        }
      });

      async function sendMail({ to, subject, text, html, attachments }) {
        const mailOptions = { from: email, to, subject, text, html, attachments };
        return await transporter.sendMail(mailOptions);
      }

      global.utils.sendMail = sendMail;
      global.utils.transporter = transporter;
      utils.log.success("CÉLESTIN - GMAIL", "Service d'envoi d'emails prêt !");
    } catch (err) {
      utils.log.warn("CÉLESTIN - GMAIL", "Service mail ignoré (identifiants non valides).");
    }
  }

  // —————————— VÉRIFICATION VERSION —————————— //
  try {
    const { data: { version } } = await axios.get("https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2/main/package.json", { timeout: 5000 });
    const currentVersion = require("./package.json").version;
    if (compareVersion(version, currentVersion) === 1) {
      utils.log.master("CÉLESTIN - UPDATE", getText(
        "Goat",
        "newVersionDetected",
        colors.gray(currentVersion),
        colors.hex("#eb6a07", version),
        colors.hex("#eb6a07", "node update")
      ));
    }
  } catch (err) {
    utils.log.warn("CÉLESTIN - VERSION", "Impossible de vérifier la version officielle.");
  }

  // —————————— GOOGLE DRIVE —————————— //
  try {
    const parentIdGoogleDrive = await utils.drive.checkAndCreateParentFolder("GoatBot");
    utils.drive.parentID = parentIdGoogleDrive;
  } catch (err) {
    utils.log.warn("CÉLESTIN - DRIVE", "Google Drive désactivé.");
  }

  // —————————— CONNEXION —————————— //
  utils.log.info("CÉLESTIN", "Lancement du processus de connexion... 🚀");
  require(`./bot/login/login${NODE_ENV === 'development' ? '.dev.js' : '.js'}`);
})();

function compareVersion(version1, version2) {
  const v1 = version1.split(".");
  const v2 = version2.split(".");
  for (let i = 0; i < 3; i++) {
    if (parseInt(v1[i]) > parseInt(v2[i])) return 1;
    if (parseInt(v1[i]) < parseInt(v2[i])) return -1;
  }
  return 0;
}

// ———————————————— NETTOYAGE LORS DE L'ARRÊT ———————————————— //
process.on('SIGINT', () => {
  utils.log.info("CÉLESTIN", "Arrêt du bot en cours...");
  process.exit(0);
});

process.on('SIGTERM', () => {
  utils.log.info("CÉLESTIN", "Signal de terminaison reçu. Fermeture...");
  process.exit(0);
});
