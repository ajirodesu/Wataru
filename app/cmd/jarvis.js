import fetch from 'node-fetch';

export const config = {
  name: "jarvis",
  aliases: [],
  author: "Lance Cochangco",
  description: "Get a response from Jarvis",
  usage: ["[question]"],
  cooldown: 0,
  access: "anyone",
  category: "ai"
};

export const onCommand = async function({ message, bot, chatId, args, log, usages }) {
  try {
    // Define the "best" model and system prompt
    const model = "gpt-4-turbo-2024-04-09"; // Hardcoded best model version
    const systemPrompt = "You are J.A.R.V.I.S., the advanced artificial intelligence system created by Tony Stark, also known as Iron Man..."; // Predefined system prompt

    // Join all arguments (user's question) into a single string
    const userQuestion = args.join(' ');

    // Ensure the user provided a question
    if (!userQuestion) {
      return usages();  // Sends usage information if no question is provided
    }

    // Send the initial "processing" message and store the message ID for editing later
    const processingMessage = await bot.sendMessage(chatId, "Processing your request...");

    // API URL and parameters
    const apiUrl = new URL(`${global.api.ajiro}/api/ai`);
    apiUrl.searchParams.append('model', model);
    apiUrl.searchParams.append('system', systemPrompt);
    apiUrl.searchParams.append('question', userQuestion);

    try {
      // Send the request using node-fetch
      const response = await fetch(apiUrl.toString());
      const data = await response.json();

      if (data.error) {
        // Edit the "processing" message to show the error
        await bot.editMessageText(`Error: ${data.message}`, {
          chat_id: chatId,
          message_id: processingMessage.message_id
        });
      } else {
        // Edit the "processing" message to show the AI's response
        await bot.editMessageText(`${data.response}`, {
          chat_id: chatId,
          message_id: processingMessage.message_id
        });
      }
    } catch (error) {
      log.error("Error fetching API:", error);
      // Edit the message to inform about the error
      await bot.editMessageText(`An error occurred while fetching the API: ${error.message}`, {
        chat_id: chatId,
        message_id: processingMessage.message_id
      });
    }

  } catch (error) {
    log.error("Error executing command:", error);
    await bot.sendMessage(chatId, `An error occurred: ${error.message}`);
  }
};