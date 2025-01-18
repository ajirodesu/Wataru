import axios from 'axios';

export const setup = {
  name: "advice",
  aliases: [],
  version: "0.0.1",
  author: "Lance Cochangco", // Change this to your name
  description: "Fetches a random piece of advice.",
  guide: [""],
  cooldown: 0,
  type: "anyone",
  category: "utility"
};

export const onStart = async function({ message, bot, chatId, userId, log }) {
  try {
    const response = await axios.get('https://api.adviceslip.com/advice');

    if (response.status === 200 && response.data && response.data.slip) {
      const advice = response.data.slip.advice; // Extract the advice text

      // Send the advice to the chat
      await bot.sendMessage(chatId, `${advice}`);
    } else {
      await bot.sendMessage(chatId, 'Failed to fetch advice. Please try again later.');
    }
  } catch (error) {
    log.error("Error fetching advice:", error);
    await bot.sendMessage(chatId, `An error occurred while fetching advice: ${error.message}`);
  }
};
