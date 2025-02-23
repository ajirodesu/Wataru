const axios = require('axios');

exports.meta = {
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

exports.onStart = async function({ wataru, chatId, msg, args, usages }) {
  const question = args.join(" ");
  if (!question) {
    return await usages();
  }

  try {
    // Build the API URL with the user's question.
    const apiUrl = `${global.api.kaiz}/api/gpt-4o?ask=${encodeURIComponent(question)}&uid=${msg.from.id}&webSearch=off`;
    const response = await axios.get(apiUrl);

    // The API returns a JSON with keys like "response"
    const aiResponse = response.data.response || "No response was returned from the API.";

    // Send the formatted AI response using our custom reply method.
    await wataru.reply(aiResponse, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error fetching AI response:", error);
    await wataru.reply("An error occurred while fetching the AI response.");
  }
};
