// commands/accepteall.js
module.exports = {
  name: "accepteall",
  category: "Group",
  description: "Approuve toutes les demandes d'adhésion en attente (join requests).",

  async execute(sock, m, args, extra = {}) {
    const from = m.key.remoteJid;
    const { isGroup, isBotAdmin, isAdminOrOwner, prefix = "." } = extra;

    if (!isGroup) {
      return sock.sendMessage(from, { text: "❌ Groupe uniquement." }, { quoted: m });
    }

    if (!isAdminOrOwner) {
      return sock.sendMessage(from, { text: "❌ Admin uniquement." }, { quoted: m });
    }

    const mode = (args[0] || "approve").toLowerCase(); // approve | reject
    const action = (mode === "reject" || mode === "refuse") ? "reject" : "approve";

    try {
      const pending = await sock.groupRequestParticipantsList(from);

      if (!pending || !pending.length) {
        return sock.sendMessage(
          from,
          { text: "✅ Aucune demande en attente (ou validation admin désactivée)." },
          { quoted: m }
        );
      }

      // Baileys renvoie souvent [{ jid: "...", ... }]
      const jids = pending
        .map((p) => p?.jid)
        .filter(Boolean);

      // Envoi par lots (évite erreurs si trop de monde)
      const chunkSize = 50;
      let ok = 0;
      let fail = 0;

      for (let i = 0; i < jids.length; i += chunkSize) {
        const batch = jids.slice(i, i + chunkSize);
        const res = await sock.groupRequestParticipantsUpdate(from, batch, action);

        // res: [{ status, jid }]
        for (const r of (res || [])) {
          if (r?.status === "200") ok++;
          else fail++;
        }
      }

      return sock.sendMessage(
        from,
        {
          text:
`✅ Action: *${action.toUpperCase()}*
📌 Demandes traitées: *${jids.length}*
✅ OK: *${ok}*
❌ Fail: *${fail}*

Astuce: ${prefix}accepteall reject (pour refuser tout)`
        },
        { quoted: m }
      );
    } catch (e) {
      console.log("ACCEPTEALL ERROR:", e?.message || e);
      return sock.sendMessage(
        from,
        { text: "❌ Impossible de traiter les demandes (feature non dispo / groupe pas en mode validation / erreur Baileys)." },
        { quoted: m }
      );
    }
  }
};