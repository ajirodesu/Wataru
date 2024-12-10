export const reply = async ({ bot, msg, chatId, args, userId, db }) => {
  const { replies, commands } = global.client;

  if (!msg.reply_to_message) {
    return;
  }

  const replyData = replies.get(msg.reply_to_message.message_id);
  if (!replyData) {
    return;
  }

  const { commandName, ...data } = replyData;

  if (!commandName) {
    await bot.sendMessage(chatId, "Cannot find command name to execute this reply!");
    return;
  }

  const command = commands.get(commandName);
  if (!command) {
    await bot.sendMessage(chatId, `Cannot find command: ${commandName}`);
    return;
  }

  if (!command.onReply) {
    await bot.sendMessage(chatId, `Command ${commandName} doesn't support replies`);
    return;
  }

  try {
    await command.onReply({
      bot,
      msg,
      chatId,
      userId,
      args,
      db,
      data,
      commandName,
      replyMsg: msg.reply_to_message,
      message: msg,
    });
  } catch (err) {
    const errorMessage = `An error occurred while processing your reply: ${err.message}`;
    await bot.sendMessage(chatId, errorMessage);
  } finally {
    replies.delete(msg.reply_to_message.message_id);
  }
};

export default reply;