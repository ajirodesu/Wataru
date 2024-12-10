export const config = {
  name: "onlyadmin",
  aliases: ["adminonly"],
  author: "Assistant",
  description: "Toggle only admin mode for the group.",
  usage: ["on", "off"],
  cooldown: 5,
  access: "administrator",
  category: "administrator"
};

export const onCommand = async function({ bot, msg, chatId, db, args, usages }) {
  try {
    const group = db.getGroup(chatId);

    if (args.length === 0) {
      return bot.sendMessage(chatId, `Current only admin mode: ${group.onlyadmin ? 'enabled' : 'disabled'}. Use 'on' or 'off' to change.`);
    }

    const action = args[0].toLowerCase();

    if (action !== 'on' && action !== 'off') {
      return usages();
    }

    const newValue = action === 'on';

    if (newValue === group.onlyadmin) {
      return bot.sendMessage(chatId, `Only admin mode is already ${newValue ? 'enabled' : 'disabled'}.`);
    }

    await db.setOnlyAdmin(chatId, newValue);

    // Update the last activity timestamp for the group
    await db.updateGroup(chatId, (group) => {
      group.lastActivity = new Date().toISOString();
    });

    bot.sendMessage(chatId, `Only admin mode has been ${newValue ? 'enabled' : 'disabled'}.`);
  } catch (error) {
    console.error("Error executing command:", error);
    await bot.sendMessage(chatId, `An error occurred: ${error.message}`);
  }
};