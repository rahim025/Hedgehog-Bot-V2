const { spawn } = require("child_process");
const express = require("express");

const app = express();

// 🔥 Serveur obligatoire pour Render (Version Célestin - Goat Bot V2)
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="fr">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Célestin - Goat Bot V2 (Autobot Admin Core)</title>
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

          /* Arrière-plan néon Autobot */
          body::before {
              content: '';
              position: absolute;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, rgba(14, 165, 233, 0.08) 40%, transparent 70%);
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
              box-shadow: 0 0 35px rgba(239, 68, 68, 0.25), inset 0 0 15px rgba(56, 189, 248, 0.15);
              text-align: center;
              max-width: 450px;
              width: 90%;
              animation: fadeInUp 0.8s ease-out forwards;
              border: 1px solid rgba(239, 68, 68, 0.4);
          }

          /* Badge Autobot Admin */
          .status {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 6px 16px;
              background: rgba(239, 68, 68, 0.15);
              color: #f87171;
              border: 1px solid rgba(239, 68, 68, 0.5);
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
              background-color: #ef4444;
              border-radius: 50%;
              box-shadow: 0 0 10px #ef4444;
              animation: pulse 1.5s infinite;
          }

          h1 {
              margin-bottom: 6px;
              font-size: 1.8rem;
              letter-spacing: 1px;
              color: #ffffff;
              text-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
          }

          .subtitle {
              color: #94a3b8;
              font-size: 0.85rem;
              margin-bottom: 1.5rem;
              text-transform: uppercase;
              letter-spacing: 1px;
          }

          /* Formulaire Administrateur */
          .auth-box {
              background: rgba(30, 41, 59, 0.8);
              border: 1px solid rgba(255, 255, 255, 0.1);
              padding: 1.2rem;
              border-radius: 12px;
              margin-bottom: 1rem;
              text-align: left;
          }

          .input-group {
              margin-bottom: 1rem;
          }

          .input-group label {
              display: block;
              font-size: 0.75rem;
              color: #f87171;
              text-transform: uppercase;
              font-weight: 700;
              margin-bottom: 6px;
              letter-spacing: 0.8px;
          }

          .input-group input {
              width: 100%;
              padding: 10px 12px;
              background: #0f172a;
              border: 1px solid #334155;
              border-radius: 8px;
              color: #f8fafc;
              font-size: 0.9rem;
              outline: none;
              transition: all 0.3s;
          }

          .input-group input:focus {
              border-color: #ef4444;
              box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
          }

          .btn-connect {
              width: 100%;
              padding: 12px;
              background: linear-gradient(135deg, #dc2626, #991b1b);
              color: #ffffff;
              border: none;
              border-radius: 8px;
              font-weight: 700;
              letter-spacing: 1px;
              cursor: pointer;
              transition: transform 0.2s, box-shadow 0.2s;
              text-transform: uppercase;
          }

          .btn-connect:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 18px rgba(239, 68, 68, 0.5);
          }

          /* Affichage Compte Admin Connecté */
          .account-display {
              display: none;
              background: rgba(239, 68, 68, 0.1);
              border: 1px solid rgba(239, 68, 68, 0.4);
              padding: 1.2rem;
              border-radius: 12px;
              margin-top: 1rem;
              animation: fadeInUp 0.5s ease-out;
          }

          .admin-tag {
              display: inline-block;
              background: #ef4444;
              color: #fff;
              font-size: 0.7rem;
              font-weight: 800;
              padding: 2px 8px;
              border-radius: 4px;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
          }

          .account-info {
              font-size: 0.88rem;
              color: #e2e8f0;
              line-height: 1.6;
          }

          .uid-badge {
              font-family: monospace;
              background: #0f172a;
              padding: 3px 8px;
              border-radius: 6px;
              color: #38bdf8;
              border: 1px solid rgba(56, 189, 248, 0.3);
              font-weight: bold;
          }

          /* Animations */
          @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
          }

          @keyframes pulse {
              0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
              70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
              100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
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
              <span class="dot"></span> Autobot Mode Active
          </div>
          <h1>Célestin - Goat Bot V2</h1>
          <p class="subtitle">Panneau d'administration & Contrôle UID</p>

          <div class="auth-box" id="authForm">
              <div class="input-group">
                  <label for="username">Nom du Compte Admin</label>
                  <input type="text" id="username" placeholder="Ex: Master Admin / Célestin">
              </div>
              <div class="input-group">
                  <label for="uid">UID Administrateur</label>
                  <input type="text" id="uid" placeholder="Ex: 100084739201928">
              </div>
              <button class="btn-connect" onclick="connectBot()">Accorder les privilèges Admin</button>
          </div>

          <div class="account-display" id="accountDisplay">
              <span class="admin-tag">Access Granted</span>
              <p style="color: #f87171; font-weight: 700; margin-bottom: 6px;">🤖 Autobot Connecté en Admin</p>
              <div class="account-info">
                  <strong>Compte :</strong> <span id="dispUser">-</span><br>
                  <strong>UID Admin :</strong> <span id="dispUid" class="uid-badge">-</span>
              </div>
          </div>
      </div>

      <script>
          function connectBot() {
              const username = document.getElementById('username').value;
              const uid = document.getElementById('uid').value;

              if (username && uid) {
                  document.getElementById('dispUser').textContent = username;
                  document.getElementById('dispUid').textContent = uid;
                  
                  document.getElementById('authForm').style.display = 'none';
                  document.getElementById('accountDisplay').style.display = 'block';
              } else {
                  alert('Veuillez saisir le nom de compte et l\'UID Administrateur.');
              }
          }
      </script>
  </body>
  </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🌍 Server running on port " + PORT);
});

// 💥 sécurité anti crash
process.on("uncaughtException", err => console.error("💥", err));
process.on("unhandledRejection", err => console.error("💥", err));

// 🚀 lancement bot
function startBot() {
  const child = spawn("node", ["Goat.js"], {
    stdio: "inherit",
    shell: true
  });

  child.on("close", (code) => {
    console.log("🔁 Bot arrêté avec code:", code);

    // restart seulement si erreur
    if (code !== 0) {
      setTimeout(() => {
        console.log("♻️ Redémarrage...");
        startBot();
      }, 5000);
    }
  });

  child.on("error", (err) => {
    console.error("❌ Spawn error:", err);
  });
}

startBot();
