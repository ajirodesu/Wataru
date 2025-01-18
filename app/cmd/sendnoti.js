export const setup = {
  name: "sendnoti",
  aliases: [],
  version: "0.0.1",
  author: "Lance Ajiro",
  description: "Send a notification to all chat groups",
  guide: ["[message]"],
  cooldown: 0,
  type: "admin",
  category: "owner",
};

export const onStart = async function({ message, bot, chatId, userId, args, log, usages, db }) {
  try {
    const notificationMessage = args.join(' ');
    const operatorFullName = `${message.from.first_name} ${message.from.last_name || ''}`.trim(); // Get full name of the operator

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

    // Customize the message with the operator's full name
    const personalizedMessage = `${notificationMessage}\n\nfrom Admin: ${operatorFullName}`;

    for (const groupId of groupIds) {
      try {
        await bot.sendMessage(groupId, personalizedMessage);
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
    log.error("Error executing sendnoti command:", error);
    await bot.sendMessage(chatId, "An error occurred while sending notifications.");
  }
};
