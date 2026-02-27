// commands/autostatus.js
const fs = require("fs");
const path = require("path");
const config = require("../config");

const dbPath = path.join(__dirname, "../data/autostatus.json");

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ enabled: false }, null, 2));
  }
}

function readDb() {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
  } catch {
    return { enabled: false };
  }
}

function writeDb(obj) {
  fs.writeFileSync(dbPath, JSON.stringify(obj, null, 2));
}

module.exports = {
  name: "autostatus",
  category: "Tools",
  description: "Voir automatiquement les status (on/off/status)",

  async execute(sock, m, args, extra = {}) {
    const from = m.key.remoteJid;
    const { isOwner, prefix = config.PREFIX || "." } = extra;

    // (optionnel) réservé owner pour éviter abus
    if (!isOwner) {
      return sock.sendMessage(from, { text: "🚫 Commande réservée au propriétaire." }, { quoted: m });
    }

    const sub = (args[0] || "").toLowerCase();
    const db = readDb();

    if (sub === "on") {
      db.enabled = true;
      writeDb(db);
      return sock.sendMessage(from, { text: "✅ AutoStatus activé (le bot verra les status automatiquement.)" }, { quoted: m });
    }

    if (sub === "off") {
      db.enabled = false;
      writeDb(db);
      return sock.sendMessage(from, { text: "❌ AutoStatus désactivé." }, { quoted: m });
    }

    if (sub === "status") {
      return sock.sendMessage(from, { text: `📌 AutoStatus: *${db.enabled ? "ON ✅" : "OFF ❌"}*` }, { quoted: m });
    }

    return sock.sendMessage(
      from,
      { text: `Utilisation:\n${prefix}autostatus on\n${prefix}autostatus off\n${prefix}autostatus status` },
      { quoted: m }
    );
  }
};