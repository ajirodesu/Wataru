export const setup = {
  name: "start",
  aliases: [],
  version: "0.0.1",
  author: "Lance Cochangco",
  description: "Initiates The Bot",
  guide: [""],
  cooldown: 0,
  type: 'anyone',
  category: "utility"
};

export const onStart = async function({ bot, chatId, args, help }) {
  await bot.sendMessage(chatId, 'Hello There. Press the button below to get all of the available commands', help);
};
