exports.setup = {
  name: "callbot",
  keyword: ["bot"],
  aliases: [],
  version: "40.0.3",
  author: "John Lester",
  description: "Automatically responds when someone mentions 'bot'.",
  guide: [""],
  cooldown: 60,
  type: "anyone",
  category: "hidden"
};

// Array of random responses.
const randomResponses = [
  "Hello, my name is {botname}.",
  "What exactly do you want me to do?",
  "Love you <3",
  "Hi, hello baby wife :3",
  "To contact admin, use callad!",
  "You're the most adorable bot on the planet.",
  "It's me~~~~"
];

/**
 * Fetches the bot's name using node-telegram-bot-api.
 */
async function getBotName(bot) {
  const botInfo = await bot.getMe();
  return botInfo.first_name || "Bot";
}

/**
 * onStart is called when the command is invoked directly.
 */
exports.onStart = async function ({ bot, msg }) {
  const botname = await getBotName(bot);
  const name = msg.from.first_name || "User";
  const response =
    randomResponses[Math.floor(Math.random() * randomResponses.length)].replace("{botname}", botname);
  await bot.sendMessage(msg.chat.id, `${name}, ${response}`, {
    parse_mode: "HTML"
  });
};

/**
 * onEvent is triggered by the global event handler
 * whenever a message contains any of the keywords.
 */
exports.onEvent = async function ({ bot, msg }) {
  const botname = await getBotName(bot);
  const name = (`${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim()) || "User";
  const response =
    randomResponses[Math.floor(Math.random() * randomResponses.length)].replace("{botname}", botname);
  await bot.sendMessage(msg.chat.id, `${name}, ${response}`, {
    parse_mode: "HTML"
  });
};