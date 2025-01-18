import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const setup = {
  name: "sing",
  aliases: [],
  version: "0.0.1",
  author: "dipto",
  description: "Download audio from YouTube",
  guide: ["<song name>|<song link>"],
  cooldown: 5,
  type: "anyone",
  category: "media"
};

const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`
  );
  return base.data.api;
};

// Handling the command with args (either a song link or song name)
export const onStart = async ({ bot, message, chatId, userId, args, log, usages }) => {
  const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
  let videoID;
  const urlYtb = checkurl.test(args[0]);

  // Handle YouTube URL
  if (urlYtb) {
    const match = args[0].match(checkurl);
    videoID = match ? match[1] : null;

    const downloadingMessage = await bot.sendMessage(chatId, '🔄 Downloading...');
    try {
      const { data: { title, downloadLink } } = await axios.get(
        `${await baseApiUrl()}/ytDl3?link=${videoID}&format=mp3`
      );
      await bot.deleteMessage(chatId, downloadingMessage.message_id);

      const filePath = await downloadAudio(downloadLink, 'audio.mp3');
      await bot.sendAudio(chatId, filePath, { caption: title });
      fs.unlinkSync(filePath);
    } catch (error) {
      log.error(error);
      await bot.deleteMessage(chatId, downloadingMessage.message_id);
      await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
    return;
  }

  // Handle song search by keyword
  const keyWord = args.join(" ");
  const maxResults = 6;
  let result;

  try {
    result = (await axios.get(`${await baseApiUrl()}/ytFullSearch?songName=${keyWord}`)).data.slice(0, maxResults);
  } catch (err) {
    return bot.sendMessage(chatId, `❌ An error occurred: ${err.message}`);
  }

  if (result.length === 0) {
    return bot.sendMessage(chatId, `⭕ No search results found for: ${keyWord}`);
  }

  // Prepare buttons for song choices
  const buttons = result.map((info, index) => [
    { text: `${index + 1}. ${info.title} (${info.time})`, callback_data: JSON.stringify({ command: "sing", choice: index, userId }) }
  ]);

  // Display a message with only buttons (without listing the songs)
  const loadingMessage = await bot.sendMessage(chatId, "🔄 Select a song by clicking below:", {
    reply_markup: { inline_keyboard: buttons }
  });

  // Store results for later use in onButton
  global.client.results = { result, loadingMessage };
};

// Handling button clicks to download the selected song
export const onButton = async ({ bot, chatId, userId, data }) => {
  const { choice, userId: originalUserId } = data;

  // Ensure that only the original user can make a selection
  if (userId.toString() !== originalUserId.toString()) {
    return bot.answerCallbackQuery(data.callback_query_id, { text: "This selection is not for you!", show_alert: true });
  }

  const { result, loadingMessage } = global.client.results;
  const infoChoice = result[choice];

  // Transform the existing message into "Downloading..." and delete it afterward
  await bot.editMessageText('🔄 Downloading...', {
    chat_id: chatId,
    message_id: loadingMessage.message_id
  });

  try {
    const { data: { title, downloadLink, quality } } = await axios.get(`${await baseApiUrl()}/ytDl3?link=${infoChoice.id}&format=mp3`);
    
    await bot.deleteMessage(chatId, loadingMessage.message_id); // Delete loading message

    const filePath = await downloadAudio(downloadLink, 'audio.mp3');
    await bot.sendAudio(chatId, filePath, { caption: `• Title: ${title}\n• Quality: ${quality}` });
    fs.unlinkSync(filePath);
  } catch (error) {
    log.error(error);
    await bot.deleteMessage(chatId, loadingMessage.message_id);
    await bot.sendMessage(chatId, `⭕ Error: ${error.message}`);
  }
};

// Function to download audio from the URL
async function downloadAudio(url, fileName) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const filePath = path.resolve('app', 'temp', fileName);
  fs.writeFileSync(filePath, Buffer.from(response.data));
  return filePath;
}
