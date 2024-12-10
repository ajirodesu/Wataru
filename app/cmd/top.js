export const config = {
  name: "top",
  aliases: ["leaderboard"],
  author: "Assistant",
  description: "Display the top users by experience points.",
  usage: ["", "<number>"],
  cooldown: 10,
  access: "anyone",
  category: "utility"
};

export const onCommand = async function({ message, bot, chatId, userId, args, log, db }) {
  try {
    let limit = 10; // Default limit
    if (args.length > 0) {
      const requestedLimit = parseInt(args[0]);
      if (!isNaN(requestedLimit) && requestedLimit > 0) {
        limit = Math.min(requestedLimit, 50); // Cap at 50 to prevent abuse
      }
    }

    const topUsers = db.getTopUsers(limit);

    if (topUsers.length === 0) {
      await bot.sendMessage(chatId, "No users found in the leaderboard.");
      return;
    }

    let response = "🏆 Top Users 🏆\n\n";
    topUsers.forEach((user, index) => {
      response += `${index + 1}. ${user.name || 'Unknown'} - Level: ${user.level}, XP: ${user.exp}\n`;
    });

    await bot.sendMessage(chatId, response);
  } catch (error) {
    log.error("Error executing top command:", error);
    await bot.sendMessage(chatId, `An error occurred: ${error.message}`);
  }
};