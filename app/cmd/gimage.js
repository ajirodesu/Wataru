import axios from 'axios';

export const setup = {
  name: "gimage",
  aliases: [],
  version: "0.0.1",
  author: "Ryzendesu",
  description: "Searches for landscape images.",
  guide: ["<query>"],
  cooldown: 0,
  type: "anyone",
  category: "media"
};

export const onStart = async function({ message, bot, chatId, args, log, usages }) {
  try {
    // Check if the user provided a search query
    if (args.length === 0) {
      await usages();
      return;
    }

    // Join args into the search query
    const query = args.join(" ");

    // Fetch images from the API
    const response = await axios.get(`${global.api.ryzen}/api/search/gimage?query=${encodeURIComponent(query)}`);
    const imageUrls = response.data;

    // Check if there are results
    if (imageUrls.length === 0) {
      await bot.sendMessage(chatId, "No images found for your query.");
      return;
    }

    // Initialize an array to hold media for sending in bulk
    const mediaGroup = [];

    // Prepare up to 10 images using URLs
    for (let i = 0; i < Math.min(imageUrls.length, 10); i++) {
      const imageUrl = imageUrls[i];

      // Push the image as a media group object using the URL
      mediaGroup.push({
        type: 'photo',
        media: imageUrl  // Direct URL
      });
    }

    // Send all images as a group
    await bot.sendMediaGroup(chatId, mediaGroup);

  } catch (error) {
    log.error("Error fetching image search results: " + error);
    // Send error message to the chat if the API request fails
    await bot.sendMessage(chatId, `An error occurred while searching for images: ${error.message}`);
  }
};
