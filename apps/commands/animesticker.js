import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

export const config = {
  name: "animesticker",
  aliases: [],
  author: "Lance Cochangco",
  description: "Fetch a random anime sticker",
  usage: [""],
  cooldown: 0,
  access: "anyone",
  category: "anime"
};

export const onCommand = async function({ message, bot, chatId, userId, args, log, usages }) {
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
    const cacheFolder = path.join(process.cwd(), 'apps', 'tmp');
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
