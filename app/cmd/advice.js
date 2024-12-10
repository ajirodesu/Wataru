import axios from 'axios';

export const config = {
  name: "advice",
  aliases: [],
  author: "Lance Cochangco", // Change this to your name
  description: "Fetches a random piece of advice.",
  usage: [""],
  cooldown: 0,
  access: "anyone",
  category: "utility"
};

export const onCommand = async function({ message, bot, chatId, userId, log }) {
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
