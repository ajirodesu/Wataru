import axios from 'axios';

export const config = {
  name: "gimage",
  aliases: [],
  author: "Ryzendesu",
  description: "Searches for landscape images.",
  usage: ["<query>"],
  cooldown: 0,
  access: "anyone",
  category: "media"
};

export const onCommand = async function({ message, bot, chatId, args, log, usages }) {
  try {
    // Check if the user provided a search query
    if (args.length === 0) {
      await usages();
      return;
    }

    // Join args into the search query
    const query = args.join(" ");

    // Fetch images from the API
    const response = await axios.get(`${global.config.ryzen}/api/search/gimage?query=${encodeURIComponent(query)}`);
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
