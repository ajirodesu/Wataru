import axios from 'axios';

export const config = {
  name: "search",
  aliases: [],
  author: "Lance Cochangco",
  description: "Search for information about a topic.",
  usage: ["<topic>"],
  cooldown: 0,
  access: "anyone",
  category: "utility"
};

export const onCommand = async function({ message, bot, log, args }) {
  try {
    const chatId = message.chat.id;

    // Get the search query from the command arguments
    const query = args.join(" ") || "who is Jose Rizal"; // Default query
    const apiUrl = `${global.api.ajiro}/api/search?query=${encodeURIComponent(query)}`;

    // Fetch search results from the API
    const response = await axios.get(apiUrl);
    const results = response.data;

    if (results.length === 0) {
      await bot.sendMessage(chatId, "No results found for your search.");
      return;
    }

    // Randomly select an index (first, middle, or last)
    const randomIndex = Math.floor(Math.random() * 3); // 0: first, 1: middle, 2: last
    let selectedResult;

    if (randomIndex === 0) {
      selectedResult = results[0]; // First result
    } else if (randomIndex === 1) {
      selectedResult = results[Math.floor(results.length / 2)]; // Middle result
    } else {
      selectedResult = results[results.length - 1]; // Last result
    }

    // Prepare the message to send
    const messageText = `*Title:* ${selectedResult.title}\n\n` +
                        `*Description:* ${selectedResult.description}\n\n` +
                        `*Source:* [${selectedResult.source}](${selectedResult.url})`;

    // Send the result back to the chat with Markdown formatting
    await bot.sendMessage(chatId, messageText, { parse_mode: "Markdown" });
    
  } catch (error) {
    log.error("Error fetching search results:", error);
    await bot.sendMessage(chatId, `An error occurred while fetching the search results: ${error.message}`);
  }
};
