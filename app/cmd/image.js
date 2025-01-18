import axios from 'axios';
import { promises as fsPromises } from 'fs'; // Promises version for async operations
import fs from 'fs'; // Regular fs for createReadStream
import path from 'path';

export const setup = {
  name: 'image',
  description: 'Search for images using Unsplash',
  version: "0.0.1",
  author: 'Shinpei',
  type: 'anyone',
  guide: '[query]',
  category: 'media',
};

export const onStart = async ({ bot, chatId, args }) => {
  try {
    const searchQuery = args.join(' ');
    if (!searchQuery) {
      const sentMessage = await bot.sendMessage(chatId, 'Now reply your search query to proceed');
      // Save reply event
      global.client.replies.set(sentMessage.message_id, {
        commandName: 'image',
      });
    } else {
      await searchAndSendImages(bot, chatId, searchQuery);
    }
  } catch (error) {
    console.error(error);
    await bot.sendMessage(chatId, "🚫 An error occurred while fetching data.");
  }
};

export const onReply = async ({ bot, chatId, msg, data }) => {
  try {
    const searchQuery = msg.text.trim();
    if (searchQuery.toLowerCase() === 'cancel') {
      await bot.sendMessage(chatId, '❌ Search canceled.');
    } else if (searchQuery) {
      await searchAndSendImages(bot, chatId, searchQuery, data);
    } else {
      await bot.sendMessage(chatId, '🚫 Invalid search query. Please provide a valid search query.');
    }
  } catch (error) {
    console.error("Error handling reply:", error);
    await bot.sendMessage(chatId, `🚫 An error occurred while handling your reply. Please try again later.\n${error.message}`);
  }
};

const searchAndSendImages = async (bot, chatId, searchQuery) => {
  const cacheDir = path.join(process.cwd(), 'app', 'temp');
  await fsPromises.mkdir(cacheDir, { recursive: true });
  let loadingMessage;
  try {
    loadingMessage = await bot.sendMessage(chatId, '🕟 Searching for images on Unsplash, please wait...');
    const { data } = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        page: 1,
        per_page: 10,
        query: searchQuery,
        client_id: 'oWmBq0kLICkR_5Sp7m5xcLTAdkNtEcRG7zrd55ZX6oQ'
      }
    });

    const { results } = data;
    if (results.length === 0) {
      await bot.editMessageText('🚫 No images found for the query.', { chat_id: chatId, message_id: loadingMessage.message_id });
      return;
    }

    const media = await Promise.all(results.map(async (result, index) => {
      const imagePath = path.join(cacheDir, `unsplash_${Date.now()}_${index + 1}.jpg`);
      const { data: imageData } = await axios.get(result.urls.regular, { responseType: 'arraybuffer' });
      await fsPromises.writeFile(imagePath, Buffer.from(imageData));
      return { type: 'photo', media: fs.createReadStream(imagePath) };  // Use regular fs for createReadStream
    }));

    await bot.editMessageText('✔️ Images found. Sending now...', { chat_id: chatId, message_id: loadingMessage.message_id });
    await bot.sendMediaGroup(chatId, media);

    // Delete the loading message after success
    await bot.deleteMessage(chatId, loadingMessage.message_id);

  } catch (error) {
    console.error(error);
    if (loadingMessage) {
      await bot.editMessageText('🚫 An error occurred while fetching data.', { chat_id: chatId, message_id: loadingMessage.message_id });
    } else {
      await bot.sendMessage(chatId, '🚫 An error occurred while fetching data.');
    }
  }
};
