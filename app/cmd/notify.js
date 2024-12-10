export const config = {
  name: "notify",
  aliases: [],
  author: "Lance Ajiro",
  description: "Send a notification to all chat groups",
  usage: ["[message]"],
  cooldown: 0,
  access: "admin",
  category: "owner",
};

export const onCommand = async function({ message, bot, chatId, userId, args, log, usages, db }) {
  try {
    const notificationMessage = args.join(' ');
    if (!notificationMessage) {
      return usages();
    }

    const groupIds = db.getAllGroupIds();
    const totalGroups = groupIds.length;

    if (totalGroups === 0) {
      return bot.sendMessage(chatId, "No chat groups found to send the message.");
    }

    let successCount = 0;
    let failureCount = 0;

    for (const groupId of groupIds) {
      try {
        await bot.sendMessage(groupId, notificationMessage);
        successCount++;
      } catch (error) {
        log.error(`Error sending message to group ${groupId}:`, error);
        failureCount++;
      }
    }

    const resultMessage = `
Notification sent to all chat groups.
${global.config.symbols} Success: ${successCount} groups
${global.config.symbols} Failed: ${failureCount} groups
    `;
    await bot.sendMessage(chatId, resultMessage);
  } catch (error) {
    log.error("Error executing notify command:", error);
    await bot.sendMessage(chatId, "An error occurred while sending notifications.");
  }
};
