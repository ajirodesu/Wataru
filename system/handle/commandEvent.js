const { commands } = global.client; // Ensure global.client.commands is a Map

exports.commandEvent = async function ({ bot, msg, chatId }) {
  if (!msg || !msg.text) return;

  // Iterate over all registered commands.
  for (const cmd of commands.values()) {
    if (cmd.setup && cmd.setup.keyword) {
      const keywords = Array.isArray(cmd.setup.keyword) ? cmd.setup.keyword : [cmd.setup.keyword];

      // Convert keywords into a single regex pattern for efficient detection.
      const keywordRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "i");

      // If any of the keywords are found in the message text...
      if (keywordRegex.test(msg.text)) {
        const args = msg.text.trim().split(/\s+/);
        try {
          await cmd.onEvent({ bot, msg, chatId, args });
        } catch (error) {
          console.error(`Error in event handler for command "${cmd.setup.name}": ${error.message}`);
        }
      }
    }
  }
};