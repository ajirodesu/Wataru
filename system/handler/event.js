export const event = async ({ bot, msg, chatId, userId, log, db }) => {
  const { events } = global.client;

  try {
    // Iterate over each event in the events map
    for (const { config, onEvent } of events.values()) {
      // Ensure the event has a valid configuration and handler
      if (config?.name && typeof onEvent === 'function') {
        await onEvent({
          bot,
          msg,
          chatId,
          userId,
          log,
          db,
        });
      }
    }
  } catch (error) {
    log.error(`Error processing event: ${error.stack}`);
    await bot.sendMessage(chatId, `❌ | An error occurred while processing an event: ${error.message}`);
  }
};

export default event;