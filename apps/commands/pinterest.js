import axios from "axios";

export const config = {  
  name: "pinterest",  
  aliases: ["pint"],  
  author: "Lance Cochangco",  
  description: "Search for Pinterest images and send them as a media group.",  
  usage: ["<query>"],  
  cooldown: 0,  
  access: "anyone",  
  category: "media"  
};

export const onCommand = async function({ message, bot, chatId, args, log, usages }) {  
  try {  
    // Check if a query is provided  
    if (args.length === 0) {  
      return await usages();  
    }  

    const query = args.join(" ");  
    const apiUrl = `${global.config.ryzen}/api/search/pinterest?query=${encodeURIComponent(query)}`;

    // Fetch the image URLs using Axios
    const response = await axios.get(apiUrl);

    const images = response.data;

    // Check if images were returned  
    if (!Array.isArray(images) || images.length === 0) {  
      return await bot.sendMessage(chatId, "No images found for your query.");  
    }  

    // Limit the number of images to 10 (maximum for media group)  
    const mediaGroup = images.slice(0, 10).map(url => ({
      type: "photo",  
      media: url,  
    }));  

    // Send the media group  
    await bot.sendMediaGroup(chatId, mediaGroup);  
  } catch (error) {  
    log.error("Error executing command:", error);  
    await bot.sendMessage(chatId, `An error occurred: ${error.message}`);  
  }  
};
