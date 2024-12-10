import axios from 'axios';

export const config = {
  name: "txt2img",
  aliases: ["text-to-image"],
  author: "Lance Cochangco",
  description: "Generate and send a image based on user's prompt.",
  usage: ["<prompt>"],
  cooldown: 10,
  access: "anyone",
  category: "AI"
};

export const onCommand = async function({ message, bot, chatId, args, log, usages }) {
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
    const response = await axios.get(`${global.api.ryzen}/api/ai/text2img`, {
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