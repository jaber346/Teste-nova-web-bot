// ==================== commands/id.js ====================
const config = require("../config");

const DEFAULT_NEWSLETTER_JID = "120363423249667073@newsletter";
const DEFAULT_NEWSLETTER_NAME = config.BOT_NAME || "NOVA XMD V1";

function newsletterCtx(jid = DEFAULT_NEWSLETTER_JID, name = DEFAULT_NEWSLETTER_NAME) {
  return {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: jid,
      newsletterName: name,
      serverMessageId: 1
    }
  };
}

// 🔎 Trouver newsletterJid depuis le message (si tu réponds à un forward de chaîne)
function getNewsletterJidFromMessage(m) {
  const msg = m.message || {};

  const ctx =
    msg.extendedTextMessage?.contextInfo ||
    msg.imageMessage?.contextInfo ||
    msg.videoMessage?.contextInfo ||
    msg.documentMessage?.contextInfo ||
    msg.buttonsMessage?.contextInfo ||
    msg.templateMessage?.contextInfo ||
    msg.listMessage?.contextInfo ||
    msg.contextInfo ||
    null;

  const jid =
    ctx?.forwardedNewsletterMessageInfo?.newsletterJid ||
    ctx?.forwardedNewsletterMessageInfo?.jid ||
    null;

  return jid && String(jid).endsWith("@newsletter") ? String(jid) : null;
}

module.exports = {
  name: "id",
  category: "Tools",
  description: "Afficher ID user/groupe + envoyer preview newsletter (chaine)",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const cmdArg = (args?.[0] || "").toLowerCase();

    // ✅ newsletter target: si tu veux forcer .id newsletter
    let targetNewsletterJid =
      getNewsletterJidFromMessage(m) || DEFAULT_NEWSLETTER_JID;

    // si utilisateur fait: .id chaine / .id newsletter
    if (cmdArg === "news" || cmdArg === "newsletter" || cmdArg === "chaine" || cmdArg === "channel") {
      const text =
`╭━━〔 📰 CHAINE / NEWSLETTER 〕━━╮
┃ *JID:* ${targetNewsletterJid}
┃ *Name:* ${DEFAULT_NEWSLETTER_NAME}
┃ *Note:* (Followers non dispo via Baileys)
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

      return sock.sendMessage(
        from,
        { text, contextInfo: newsletterCtx(targetNewsletterJid) },
        { quoted: m }
      );
    }

    // 🧑 Privé
    if (from.endsWith("@s.whatsapp.net")) {
      const user = from.split("@")[0];

      const text =
`╭━━〔 🆔 USER INFO 〕━━╮
┃ 👤 User : ${user}
┃ 💬 Chat : ${from}
┃ 👥 Type : Privé
┃ 📰 Chaine : ${targetNewsletterJid}
╰━━━━━━━━━━━━━━━━━━━━━━╯`;

      return sock.sendMessage(
        from,
        { text, contextInfo: newsletterCtx(targetNewsletterJid) },
        { quoted: m }
      );
    }

    // 👥 Groupe
    if (from.endsWith("@g.us")) {
      let meta;
      try {
        meta = await sock.groupMetadata(from);
      } catch (e) {
        meta = null;
      }

      const text =
`╭━━〔 🆔 GROUPE INFO 〕━━╮
┃ *ID:* ${from}
┃ *Name:* ${meta?.subject || "N/A"}
┃ *Participants:* ${meta?.participants?.length ?? "N/A"}
┃ 📰 Chaine : ${targetNewsletterJid}
╰━━━━━━━━━━━━━━━━━━━━━━╯`;

      return sock.sendMessage(
        from,
        { text, contextInfo: newsletterCtx(targetNewsletterJid) },
        { quoted: m }
      );
    }

    // 📌 Autres types (status, broadcast, etc.)
    const text =
`╭━━〔 🆔 CHAT INFO 〕━━╮
┃ *ID:* ${from}
┃ 📰 Chaine : ${targetNewsletterJid}
╰━━━━━━━━━━━━━━━━━━━━━━╯`;

    return sock.sendMessage(
      from,
      { text, contextInfo: newsletterCtx(targetNewsletterJid) },
      { quoted: m }
    );
  }
};