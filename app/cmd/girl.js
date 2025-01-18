import axios from 'axios';

export const setup = {
  name: "girl",
  aliases: [],
  version: "0.0.1",
  author: "Đức tài cuti vcl",
  description: "get a random girl photo",
  guide: [""],
  cooldown: 0,
  type: "anyone",
  category: "anime"
};

export const onStart = async function({ message, bot, chatId, log }) {
  try {
    // Fetch cosplay data from the API
    const response = await axios.get('https://raw.githubusercontent.com/ajirodesu/Rest-Api-Assets/refs/heads/main/txt/girl.txt');
    const data = response.data.split(/\r?\n/); // Split the text by new lines

    // Select one random cosplay link
    const link = data[Math.floor(Math.random() * data.length)].trim();

    // Send the random cosplay photo back to the chat
    await bot.sendPhoto(chatId, link, { caption: `Here's a random girl photo!` });

  } catch (error) {
    log.error("Error fetching girl data:", error);
    // Send error message to the chat if the API request fails
    await bot.sendMessage(chatId, `An error occurred while fetching cosplay data: ${error.message}`);
  }
};
