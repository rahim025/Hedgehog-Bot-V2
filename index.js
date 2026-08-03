const { spawn } = require("child_process");
const express = require("express");

const app = express();

// Stockage de la date de lancement
const startTime = Date.now();

// Serveur d'affichage de l'Uptime (Version Célestin - Goat Bot V2)
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="fr">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Célestin - Status & Uptime</title>
      <style>
          * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
          }
          body {
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #060913;
              color: #f8fafc;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              overflow: hidden;
          }

          /* Arrière-plan néon */
          body::before {
              content: '';
              position: absolute;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(14, 165, 233, 0.08) 40%, transparent 70%);
              animation: rotateBg 25s linear infinite;
              z-index: 0;
          }

          /* Carte principale */
          .card {
              position: relative;
              z-index: 1;
              background: rgba(15, 23, 42, 0.9);
              backdrop-filter: blur(16px);
              padding: 2.5rem;
              border-radius: 20px;
              box-shadow: 0 0 35px rgba(16, 185, 129, 0.2), inset 0 0 15px rgba(56, 189, 248, 0.15);
              text-align: center;
              max-width: 450px;
              width: 90%;
              animation: fadeInUp 0.8s ease-out forwards;
              border: 1px solid rgba(16, 185, 129, 0.3);
          }

          /* Badge d'état */
          .status {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 6px 16px;
              background: rgba(16, 185, 129, 0.15);
              color: #34d399;
              border: 1px solid rgba(16, 185, 129, 0.5);
              border-radius: 20px;
              font-size: 0.85rem;
              font-weight: 700;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              margin-bottom: 1.5rem;
          }

          .dot {
              width: 10px;
              height: 10px;
              background-color: #10b981;
              border-radius: 50%;
              box-shadow: 0 0 10px #10b981;
              animation: pulse 1.5s infinite;
          }

          h1 {
              margin-bottom: 6px;
              font-size: 1.8rem;
              letter-spacing: 1px;
              color: #ffffff;
              text-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
          }

          .subtitle {
              color: #94a3b8;
              font-size: 0.85rem;
              margin-bottom: 2rem;
              text-transform: uppercase;
              letter-spacing: 1px;
          }

          /* Affichage du compteur Uptime */
          .uptime-box {
              background: rgba(30, 41, 59, 0.8);
              border: 1px solid rgba(255, 255, 255, 0.1);
              padding: 1.5rem;
              border-radius: 14px;
              margin-bottom: 1rem;
          }

          .uptime-label {
              font-size: 0.75rem;
              color: #38bdf8;
              text-transform: uppercase;
              font-weight: 700;
              letter-spacing: 1px;
              margin-bottom: 10px;
          }

          .uptime-timer {
              font-family: monospace;
              font-size: 1.4rem;
              font-weight: bold;
              color: #f8fafc;
              letter-spacing: 2px;
              background: #0f172a;
              padding: 12px;
              border-radius: 10px;
              border: 1px solid rgba(56, 189, 248, 0.3);
              box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
          }

          /* Animations */
          @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
          }

          @keyframes pulse {
              0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
              70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
              100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }

          @keyframes rotateBg {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
          }
      </style>
  </head>
  <body>
      <div class="card">
          <div class="status">
              <span class="dot"></span> System Operational
          </div>
          <h1>Célestin - Goat Bot V2</h1>
          <p class="subtitle">Moniteur de temps de fonctionnement</p>

          <div class="uptime-box">
              <div class="uptime-label">⏱️ Uptime du Bot</div>
              <div class="uptime-timer" id="uptime">Chargement...</div>
          </div>
      </div>

      <script>
          const botStartTime = ${startTime};

          function updateUptime() {
              const now = Date.now();
              const diff = Math.floor((now - botStartTime) / 1000);

              const days = Math.floor(diff / (3600 * 24));
              const hours = Math.floor((diff % (3600 * 24)) / 3600);
              const minutes = Math.floor((diff % 3600) / 60);
              const seconds = diff % 60;

              const pad = (num) => String(num).padStart(2, '0');

              let uptimeString = '';
              if (days > 0) uptimeString += \`\${days}d \`;
              uptimeString += \`\${pad(hours)}h \${pad(minutes)}m \${pad(seconds)}s\`;

              document.getElementById('uptime').textContent = uptimeString;
          }

          setInterval(updateUptime, 1000);
          updateUptime();
      </script>
  </body>
  </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🌍 Server running on port " + PORT);
});

// 💥 Sécurité Anti-Crash
process.on("uncaughtException", err => console.error("💥 Uncaught Exception:", err));
process.on("unhandledRejection", err => console.error("💥 Unhandled Rejection:", err));

// 🚀 Lancement du bot via Child Process
function startBot() {
  const child = spawn("node", ["Goat.js"], {
    stdio: "inherit",
    shell: true
  });

  child.on("close", (code) => {
    console.log("🔁 Bot arrêté avec le code:", code);

    // Redémarrage automatique si fermeture anormale
    if (code !== 0) {
      setTimeout(() => {
        console.log("♻️ Redémarrage du bot...");
        startBot();
      }, 5000);
    }
  });

  child.on("error", (err) => {
    console.error("❌ Erreur au lancement (Spawn):", err);
  });
}

startBot();
