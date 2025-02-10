const axios = require('axios');

exports.setup = {
  name: "ai",
  aliases: ["chatgpt", "openai"],
  prefix: "both", 
  version: "1.0.0",
  author: "Kaiz API",
  description: "Ask chatGPT 4o",
  guide: ["<query>"],
  cooldown: 5,
  type: "anyone",
  category: "ai"
};

exports.onStart = async function({ bot, chatId, msg, args, usages }) {
  const question = args.join(" ");
  if (!question) {
    return await usages();
  }

  try {
    // Build the API URL with the user's question.
    const apiUrl = `https://kaiz-apis.gleeze.com/api/gpt-4o?ask=${encodeURIComponent(question)}&uid=${msg.from.id}&webSearch=off`;
    const response = await axios.get(apiUrl);

    // The API returns a JSON with "author" and "response" keys.
    const aiAuthor = response.data.author || "Unknown";
    const aiResponse = response.data.response || "No response was returned from the API.";

    // Build a formatted message including the API author and the response.
    const message = `${aiResponse}`;

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error fetching AI response:", error);
    await bot.sendMessage(chatId, "An error occurred while fetching the AI response.");
  }
};