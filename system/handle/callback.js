exports.callback = async function ({ bot }) {
  // Register the callback_query event handler.
  bot.on('callback_query', async (callbackQuery) => {
    // Ensure the callback query and its data exist.
    if (!callbackQuery || !callbackQuery.data) return;

    try {
      let payload;

      // Attempt to parse the callback data as JSON.
      try {
        payload = JSON.parse(callbackQuery.data);
      } catch (jsonError) {
        // Fallback: treat data as a colon-separated string.
        const parts = callbackQuery.data.split(':');
        payload = {
          command: parts[0],
          args: parts.slice(1),
        };
      }

      // Validate that a command name was provided.
      if (!payload.command) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: 'Invalid action.',
        });
        return;
      }

      // Normalize the command name.
      const commandName = payload.command.toLowerCase();

      // Retrieve the command from your global commands map.
      const command = global.client.commands.get(commandName);
      if (!command || typeof command.onCallback !== 'function') {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: 'Action not available.',
        });
        return;
      }

      // Build the context object.
      const context = {
        bot,
        callbackQuery,
        chatId: callbackQuery.message ? callbackQuery.message.chat.id : null,
        args: Array.isArray(payload.args) ? payload.args : [],
      };

      // Execute the command's callback handler.
      await command.onCallback(context);

      // Answer the callback query to remove the loading spinner.
      await bot.answerCallbackQuery(callbackQuery.id);
    } catch (error) {
      console.error(
        `Error handling callback query (${callbackQuery.id}): ${error.message}`,
        error
      );
      // Attempt to answer the callback query with an error message.
      try {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: 'An error occurred. Please try again later.',
        });
      } catch (innerError) {
        console.error(
          `Failed to answer callback query (${callbackQuery.id}): ${innerError.message}`,
          innerError
        );
      }
    }
  });
};
