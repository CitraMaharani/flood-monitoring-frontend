// utils/telegram.js
const axios = require("axios");

// TOKEN BOT kamu (dari BotFather)
const BOT_TOKEN = "8557136945:AAEk0yZp2FxYEHqnWb4H7wcXGnubC2L1K1Y";

// CHAT ID grup kamu
const CHAT_ID = "-1003398621087";

exports.sendAlert = async (message) => {
  try {
    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }
    );

    console.log("🚀 Notifikasi Telegram terkirim!");
  } catch (error) {
    console.error("❌ Gagal mengirim pesan Telegram:", error.message);
  }
};
