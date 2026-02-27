// commands/welcome.js
const fs = require("fs");
const path = require("path");
const config = require("../config");

const dbPath = path.join(__dirname, "../data/welcome.json");

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ welcome: false, goodbye: false }, null, 2));
  }
}

function readDb() {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
  } catch {
    return { welcome: false, goodbye: false };
  }
}

function writeDb(obj) {
  fs.writeFileSync(dbPath, JSON.stringify(obj, null, 2));
}

module.exports = {
  name: "welcome",
  category: "Group",
  description: "welcome on/off | goodbye on/off",

  async execute(sock, m, args, extra = {}) {
    const from = m.key.remoteJid;
    const { isGroup, isAdmin, prefix = config.PREFIX || "." } = extra;

    if (!isGroup) return sock.sendMessage(from, { text: "❌ Groupe uniquement." }, { quoted: m });
    if (!isAdmin) return sock.sendMessage(from, { text: "❌ Admin uniquement." }, { quoted: m });

    const sub = (args[0] || "").toLowerCase();     // welcome | goodbye
    const val = (args[1] || "").toLowerCase();     // on | off

    const db = readDb();

    if ((sub === "welcome" || sub === "bienvenue") && (val === "on" || val === "off")) {
      db.welcome = val === "on";
      writeDb(db);
      return sock.sendMessage(from, { text: `✅ Welcome : *${db.welcome ? "ON" : "OFF"}*` }, { quoted: m });
    }

    if ((sub === "goodbye" || sub === "bye" || sub === "aurevoir") && (val === "on" || val === "off")) {
      db.goodbye = val === "on";
      writeDb(db);
      return sock.sendMessage(from, { text: `✅ Goodbye : *${db.goodbye ? "ON" : "OFF"}*` }, { quoted: m });
    }

    return sock.sendMessage(
      from,
      { text: `Utilisation:\n${prefix}welcome welcome on/off\n${prefix}welcome goodbye on/off` },
      { quoted: m }
    );
  }
};