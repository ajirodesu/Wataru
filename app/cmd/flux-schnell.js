import axios from 'axios';

export const setup = {
  name: "schnell",
  aliases: ["flux-schnell"],
  version: "0.0.1",
  author: "Lance Cochangco",
  description: "Generate and send a image based on user's prompt.",
  guide: ["<prompt>"],
  cooldown: 10,
  type: "anyone",
  category: "AI"
};

export const onStart = async function({ message, bot, chatId, args, log, usages }) {
  try {
    // Check if a prompt is provided
    if (args.length === 0) {
      await usages();
      return;
    }

    // Get the user's prompt
    const userPrompt = args.join(' ');

    // Send a "generating" message
    const statusMessage = await bot.sendMessage(chatId, "Generating image...");

    // Make a request to the API
    const response = await axios.get(`${global.api.ryzen}/api/ai/flux-schnell`, {
      params: {
        prompt: userPrompt
      },
      responseType: 'arraybuffer'
    });

    // Check if the response is successful
    if (response.status !== 200) {
      throw new Error('Failed to generate image');
    }

    // Send the image
    await bot.sendPhoto(chatId, response.data, {
      caption: `Here's your generated image for: "${userPrompt}"`
    });

    // Delete the "generating" message
    await bot.deleteMessage(chatId, statusMessage.message_id);

  } catch (error) {
    log.error("Error executing command:", error);
    await bot.sendMessage(chatId, `An error occurred: ${error.message}`);
  }
};