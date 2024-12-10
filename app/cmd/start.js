export const config = {
  name: "start",
  aliases: [],
  author: "Lance Cochangco",
  description: "Initiates The Bot",
  usage: [""],
  cooldown: 0,
  access: 'anyone',
  category: "utility"
};

export const onCommand = async function({ bot, chatId, args, help }) {
  await bot.sendMessage(chatId, 'Hello There. Press the button below to get all of the available commands', help);
};
