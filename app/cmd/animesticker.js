import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

export const setup = {
  name: "animesticker",
  aliases: [],
  version: "0.0.1",
  author: "Lance Cochangco",
  description: "Fetch a random anime sticker",
  guide: [""],
  cooldown: 0,
  type: "anyone",
  category: "anime"
};

export const onStart = async function({ message, bot, chatId, userId, args, log, usages }) {
  try {
    const url = encodeURI('https://raw.githubusercontent.com/Kira-Master/database/main/sticker/animestick.json');

    // Fetch the sticker list
    const response = await fetch(url);
    const data = await response.json();

    // Select a random sticker URL
    const randomStickerUrl = data[Math.floor(Math.random() * data.length)];

    // Fetch the sticker as a buffer
    const stickerBuffer = await fetch(randomStickerUrl).then(res => res.buffer());

    // Define the cache folder and file path using cwd (current working directory)
    const cacheFolder = path.join(process.cwd(), 'app', 'temp');
    const stickerPath = path.join(cacheFolder, 'anime_sticker.jpg');

    // Ensure the cache folder exists
    if (!fs.existsSync(cacheFolder)) {
      fs.mkdirSync(cacheFolder, { recursive: true });
    }

    // Save the sticker temporarily
    fs.writeFileSync(stickerPath, stickerBuffer);

    // Send the sticker back to the chat
    await bot.sendPhoto(chatId, stickerPath);

    // Clean up the file after sending
    fs.unlinkSync(stickerPath);
  } catch (error) {
    log.error("Error fetching anime sticker:", error);
    await bot.sendMessage(chatId, "An error occurred while fetching the anime sticker.");
  }
};
