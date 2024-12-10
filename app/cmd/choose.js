export const config = {
  name: "choose",
  aliases: ["pick", "decide"],
  author: "AI Assistant",
  description: "Present a true or false question with buttons for the user to choose.",
  usage: ["<question>"],
  cooldown: 5,
  access: "anyone",
  category: "fun"
};

export const onCommand = async function({ message, bot, chatId, userId, args, log, usages }) {
  try {
    // Check if a question was provided
    if (args.length === 0) {
      return usages();
    }

    const question = args.join(" ");

    // Create inline keyboard with True and False buttons
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "True", callback_data: JSON.stringify({ command: "choose", answer: "true", userId }) },
            { text: "False", callback_data: JSON.stringify({ command: "choose", answer: "false", userId }) }
          ]
        ]
      }
    };

    // Send the question with the True/False buttons
    await bot.sendMessage(chatId, `${question}\n\nWhat's your choice?`, inlineKeyboard);
  } catch (error) {
    log.error("Error executing command:", error);
    await bot.sendMessage(chatId, `An error occurred: ${error.message}`);
  }
};

export const onButton = async function({ bot, chatId, userId, data, log }) {
  try {
    const { answer, userId: originalUserId } = data;

    // Check if the user who clicked the button is the same as the one who initiated the command
    if (userId.toString() !== originalUserId.toString()) {
      return bot.answerCallbackQuery(data.callback_query_id, {
        text: "This choice is not for you!",
        show_alert: true
      });
    }

    // Edit the original message to show the user's choice
    await bot.editMessageText(`The question was answered: ${answer.toUpperCase()}!`, {
      chat_id: chatId,
      message_id: data.message_id
    });

    // Answer the callback query to remove the loading state from the button
    await bot.answerCallbackQuery(data.callback_query_id);
  } catch (error) {
    log.error("Error handling button click:", error);
    await bot.answerCallbackQuery(data.callback_query_id, {
      text: `An error occurred: ${error.message}`,
      show_alert: true
    });
  }
}; 