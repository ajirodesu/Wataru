exports.callback = async function({ bot, msg, chatId, wataru }) {
  // Register the callback_query listener using node-telegram-bot-api functionality.
  bot.on('callback_query', async (callbackQuery) => {
    let payload;
    try {
      // Attempt to parse the callback data as JSON.
      payload = JSON.parse(callbackQuery.data);
    } catch (err) {
      // Fallback to colon-separated data.
      const parts = callbackQuery.data.split(':');
      payload = { command: parts[0], args: parts.slice(1) };
    }

    const commandName = payload.command;
    const { commands } = global.client;
    const command = commands.get(commandName);

    if (command && typeof command.onCallback === 'function') {
      try {
        await command.onCallback({
          bot,
          callbackQuery,
          // Use the chat id from the callback message.
          chatId: callbackQuery.message.chat.id,
          args: payload.args,
          payload // Pass along the entire payload for further use.
        });
      } catch (error) {
        console.error(`Error executing onCallback for command "${commandName}":`, error);
        try {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "An error occurred while processing your request."
          });
        } catch (innerError) {
          console.error(`Failed to answer callback query: ${innerError.message}`);
        }
      }
    } else {
      console.error(`No onCallback handler found for command: ${commandName}`);
      try {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid callback query." });
      } catch (innerError) {
        console.error(`Failed to answer callback query: ${innerError.message}`);
      }
    }
  });
};
