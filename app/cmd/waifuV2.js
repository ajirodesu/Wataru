import axios from 'axios';

export const setup = {
  name: "waifuv2",
  aliases: [],
  version: "0.0.1",
  author: "Ryzendesu",
  description: "Get a random SFW waifu image.",
  guide: [""],
  cooldown: 0,
  type: "anyone",
  category: "anime"
};

export const onStart = async function({ message, bot, chatId, log }) {
  try {
    // Fetch the waifu image URL from the API
    const response = await axios.get(`${global.api.ryzen}/api/weebs/sfw-waifu`);
    const waifuImageUrl = response.data.url;

    // Send the waifu image to the chat
    await bot.sendPhoto(chatId, waifuImageUrl, { caption: "Here's a random SFW waifu for you!" });

  } catch (error) {
    log.error("Error fetching waifu image: " + error);
    // Send error message to the chat if the API request fails
    await bot.sendMessage(chatId, `An error occurred while fetching a waifu image: ${error.message}`);
  }
};
