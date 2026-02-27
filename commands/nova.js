// commands/nova.js
const { GoogleGenAI } = require("@google/genai");
const config = require("../config");

module.exports = {
  name: "nova",
  category: "Tools",
  description: "Chatbot Nova Gemini",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return sock.sendMessage(
        from,
        { text: "Utilisation : .nova ton message" },
        { quoted: m }
      );
    }

    const apiKey = config.GEMINI_API_KEY;

    if (!apiKey) {
      return sock.sendMessage(
        from,
        { text: "❌ GEMINI_API_KEY non définie dans config.js" },
        { quoted: m }
      );
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const model = ai.getGenerativeModel({
        model: "gemini-2.5-flash"
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      await sock.sendMessage(
        from,
        { text: text || "Nova n'a pas pu répondre." },
        { quoted: m }
      );

    } catch (e) {
      console.log("GEMINI ERROR:", e?.message || e);
      await sock.sendMessage(
        from,
        { text: "❌ Erreur Gemini API." },
        { quoted: m }
      );
    }
  }
};