// commands/antilink.js
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../data/antilink.json");

// ===================== DB =====================
function ensureDb() {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([], null, 2));
}

function readDb() {
  ensureDb();
  try {
    const j = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function writeDb(arr) {
  fs.writeFileSync(dbPath, JSON.stringify(arr, null, 2));
}

function isEnabled(groupJid) {
  const db = readDb();
  return db.includes(groupJid);
}

// ===================== DETECT =====================
function getText(m) {
  return (
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    m.message?.imageMessage?.caption ||
    m.message?.videoMessage?.caption ||
    m.message?.documentMessage?.caption ||
    ""
  );
}

function hasLink(text = "") {
  const t = String(text || "");
  const patterns = [
    /https?:\/\/\S+/i,
    /www\.\S+/i,
    /chat\.whatsapp\.com\/\S+/i,
    /wa\.me\/\S+/i,
    /\b[\w-]+\.(com|net|org|io|app|xyz|me|gg|co|tv|info|biz|site|store|online|link|live)\b/i
  ];
  return patterns.some((re) => re.test(t));
}

// ===================== HOOK (à appeler dans handler) =====================
async function handleAntiLink(sock, m, extra = {}) {
  try {
    const from = m.key.remoteJid;
    const { isGroup, isAdmin, isOwner, isSudo, isBotAdmin } = extra;

    if (!isGroup) return false;
    if (!isEnabled(from)) return false;

    // ✅ delete message
    await sock.sendMessage(from, { delete: m.key });

    // ✅ warn
    await sock.sendMessage(from, { text: "🚫 Lien détecté — message supprimé." });

    return true;
  } catch (e) {
    console.error("ANTILINK HOOK ERROR:", e?.message || e);
    return false;
  }
}

// ===================== COMMAND =====================
async function execute(sock, m, args, extra = {}) {
  const from = m.key.remoteJid;
  const { isGroup, isAdmin, prefix = "." } = extra;

  if (!isGroup) {
    return sock.sendMessage(from, { text: "❌ Groupe uniquement." }, { quoted: m });
  }
  if (!isAdmin) {
    return sock.sendMessage(from, { text: "❌ Admin uniquement." }, { quoted: m });
  }

  const sub = (args[0] || "").toLowerCase();
  let db = readDb();

  if (sub === "on") {
    if (!db.includes(from)) db.push(from);
    writeDb(db);
    return sock.sendMessage(from, { text: "✅ Antilink activé (DELETE)." }, { quoted: m });
  }

  if (sub === "off") {
    db = db.filter((x) => x !== from);
    writeDb(db);
    return sock.sendMessage(from, { text: "❌ Antilink désactivé." }, { quoted: m });
  }

  if (sub === "status") {
    return sock.sendMessage(
      from,
      { text: `📌 Antilink: *${isEnabled(from) ? "ON ✅" : "OFF ❌"}*` },
      { quoted: m }
    );
  }

  return sock.sendMessage(
    from,
    { text: `Utilisation : ${prefix}antilink on/off/status` },
    { quoted: m }
  );
}

module.exports = {
  name: "antilink",
  category: "Security",
  description: "Antilink on/off + suppression auto des liens",
  execute,

  // ✅ export hook pour handler.js
  handleAntiLink
};