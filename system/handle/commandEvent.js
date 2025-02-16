const { commands } = global.client; // Ensure global.client.commands is a Map

exports.commandEvent = async function ({ bot, msg, chatId }) {
  if (!msg || !msg.text) return;

  const text = msg.text.trim();

  // If the message starts with the prefix, assume it's a command and exit.
  if (text.startsWith(global.config.prefix)) return;

  // Also check if the first token matches a no‑prefix or “both” command.
  const tokens = text.split(/\s+/);
  if (tokens.length > 0) {
    const firstToken = tokens[0].toLowerCase();
    for (const cmd of commands.values()) {
      // Check for commands that are meant to run without a prefix (or with "both").
      if (cmd.setup.prefix === false || cmd.setup.prefix === "both") {
        if (cmd.setup.name.toLowerCase() === firstToken) return;
        if (
          cmd.setup.aliases &&
          Array.isArray(cmd.setup.aliases) &&
          cmd.setup.aliases.map(alias => alias.toLowerCase()).includes(firstToken)
        ) {
          return;
        }
      }
    }
  }

  // If not a command invocation, process keyword events.
  for (const cmd of commands.values()) {
    if (cmd.setup && cmd.setup.keyword) {
      const keywords = Array.isArray(cmd.setup.keyword)
        ? cmd.setup.keyword
        : [cmd.setup.keyword];
      // Create a regex that matches any of the keywords (case-insensitive).
      const keywordRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "i");

      if (keywordRegex.test(msg.text)) {
        const args = text.split(/\s+/);
        try {
          await cmd.onEvent({ bot, msg, chatId, args });
        } catch (error) {
          console.error(`Error in event handler for command "${cmd.setup.name}": ${error.message}`);
        }
      }
    }
  }
};
