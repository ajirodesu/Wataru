// Command configuration
export const config = {
  name: "rank",
  aliases: ["level", "lvl"],
  author: "Lance Cochangco",
  description: "Retrieve your rank/level or the rank/level of the user you replied to.",
  usage: ["", "replied to other user's message"],
  cooldown: 0,
  access: "anyone",
  category: "utility"
};

// Command logic
export const onCommand = async function({ message, bot, chatId, userId, args, log, usages, db }) {
  try {
    let targetUserId = message.from.id; // Default to the user who issued the command
    let targetUserFullName = `${message.from.first_name} ${message.from.last_name || ''}`.trim(); // Get the full name

    // Check if the command is a reply to another user's message
    if (message.reply_to_message) {
      targetUserId = message.reply_to_message.from.id; // Get the userId of the replied-to message sender
      targetUserFullName = `${message.reply_to_message.from.first_name} ${message.reply_to_message.from.last_name || ''}`.trim(); // Get their full name
    }

    // Retrieve user data from the database
    const user = db.getUser(targetUserId);
    
    if (!user) {
      await bot.sendMessage(chatId, `${targetUserFullName} is not ranked yet.`);
      return;
    }

    // Extract relevant user information
    const userRank = user.level;
    const userExp = user.exp;
    const userMessageCount = user.messageCount;

    // Compose a professional response
    const rankMessage = `${targetUserFullName} is currently at **Level ${userRank}** with **${userExp} XP** and has sent **${userMessageCount} messages**.`;

    // Send the professional response to the chat
    await bot.sendMessage(chatId, rankMessage, { parse_mode: "Markdown"});
  } catch (error) {
    log.error("Error executing rank command:", error);
    await bot.sendMessage(chatId, `An error occurred while processing the rank request: ${error.message}`);
  }
};
