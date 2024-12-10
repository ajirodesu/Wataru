import axios from 'axios';

export const config = {
  name: "waifu",
  aliases: [],
  author: "Lance Cochangco",
  description: "Fetches waifu images based on a search query.",
  usage: ["<search query>"],
  cooldown: 0,
  access: "anyone",
  category: "anime"
};

export const onCommand = async function({ message, bot, chatId, userId, args, log, usages }) {
  try {
    const searchQuery = args.join(' '); // Combine arguments to form the search query

    if (!searchQuery) {
      return await usages();
    }

    const url = `https://api.waifu.im/search?q=${encodeURIComponent(searchQuery)}`;
    const response = await axios.get(url);
    const data = response.data;

    // Check if images are returned in the response
    if (data.images && data.images.length > 0) {
      const image = data.images[0]; // Get the first image
      const imageUrl = image.url; // Extract the image URL
      
      // Send the image to the chat
      await bot.sendPhoto(chatId, imageUrl, {
        caption: `*Waifu found!*\n\nTags: ${image.tags.map(tag => tag.name).join(', ') || 'None'}`,
        parse_mode: 'Markdown' // Optional: Use Markdown for formatting
      });
    } else {
      await bot.sendMessage(chatId, 'No images found for your search query.');
    }
  } catch (error) {
    log.error("Error executing command:", error);
    await bot.sendMessage(chatId, `An error occurred: ${error.message}`);
  }
};
