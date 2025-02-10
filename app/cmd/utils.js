exports.setup = {
  name: "utils",
  // The command will be triggered if the message contains any of these keywords.
  keyword: ["bot", "wataru"],
  aliases: [],
  version: "0.0.1",
  author: "Lance Cochangco",
  description: "Automatically responds with a random message when someone mentions the bot.",
  guide: [""],
  cooldown: 0,
  type: "anyone",
  category: "fun"
};

// Array of random responses.
const randomResponses = [
  "Yes?",
  "I'm here—what do you need?",
  "At your service!",
  "You called?",
  "How can I help?",
  "I'm listening...",
  "Ready to assist!",
  "How may I be of service?"
];

/**
 * onStart is called when the command is invoked directly (e.g. via /utils).
 */
exports.onStart = async function ({ bot, msg, chatId }) {
  const response =
    randomResponses[Math.floor(Math.random() * randomResponses.length)];
  await bot.sendMessage(chatId, response, { parse_mode: "HTML" });
};

/**
 * onEvent is triggered by the global event handler whenever a message
 * contains any of the keywords defined in setup.keyword.
 *
 * The global event handler creates a regex based on setup.keyword, so
 * there's no need to re-check for the keyword here.
 */
exports.onEvent = async function ({ bot, msg, chatId, args }) {
  const response =
    randomResponses[Math.floor(Math.random() * randomResponses.length)];
  await bot.sendMessage(chatId, response, { parse_mode: "HTML" });
};