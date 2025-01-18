import axios from "axios";

export const setup = {
  name: "shoti",
  aliases: ["short", "shortvideo"],
  version: "0.0.1",
  author: "Lance Cochangco",
  description: "Get a random short video from Shoti API",
  guide: ["", "Get a random short video"],
  cooldown: 5,
  type: "anyone",
  category: "fun"
};

export const onStart = async function({ message, bot, chatId, log }) {
  try {
    // Send a loading message
    const loadingMessage = await bot.sendMessage(chatId, "⏳ Fetching a random short video...");

    // Make API call to fetch the shoti video
    const response = await axios.get(`${global.api.ajiro}/api/shoti`);

    // Check if video URL exists
    if (!response.data.details.videoUrl) {
      await bot.sendMessage(chatId, "Sorry, couldn't fetch a video at the moment.");
      return;
    }

    // Prepare video details
    const { username, nickname, videoUrl } = response.data.details;

    // Send the video
    await bot.sendVideo(chatId, videoUrl, {
      caption: `🎥 From: @${username}\n👤 Nickname: ${nickname}`
    });

    // Delete the loading message
    await bot.deleteMessage(chatId, loadingMessage.message_id);

  } catch (error) {
    log.error("Error executing shoti command:", error);

    // Try to delete loading message if it exists
    try {
      await bot.deleteMessage(chatId, loadingMessage.message_id);
    } catch {}

    // Send error message
    await bot.sendMessage(chatId, `An error occurred: ${error.message}`);
  }
};