export const setup = {
  name: "uid",
  aliases: [],
  version: "0.0.1",
  author: "Lance Cochangco",
  description: "Get your own userId or the userId of the replied-to user.",
  guide: ["", "replied to other user's message"],
  cooldown: 0,
  type: "anyone",
  category: "utility"
};

export const onStart = async function({ message, bot, chatId, userId, args, log, usages }) {
  try {
    let targetUserId = message.from.id; // Default to the user who issued the command
    
    // Check if the command is a reply to another user's message
    if (message.reply_to_message) {
      targetUserId = message.reply_to_message.from.id; // Get the userId of the replied-to message sender
    }
    
    // Send the target user's ID back to the chat
    await bot.sendMessage(chatId, `${targetUserId}`);
  } catch (error) {
    log.error("Error executing command:", error);
    await bot.sendMessage(chatId, `An error occurred: ${error.message}`);
  }
};
