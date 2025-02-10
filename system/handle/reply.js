exports.reply = async function({ bot, msg, chatId, args }) {
  const { replies, commands } = global.client;
  const userId = msg.from.id;

  // Ensure the incoming message is a reply.
  if (!msg.reply_to_message) {
    return;
  }

  // Retrieve the reply data using the replied message's ID.
  const replyData = replies.get(msg.reply_to_message.message_id);
  if (!replyData) {
    return;
  }

  // Extract the setup object (which should contain the command name) and the rest of the data.
  const { setup, ...data } = replyData;

  if (!setup || !setup.name) {
    await bot.sendMessage(chatId, "Cannot find command name to execute this reply!", { parse_mode: "Markdown" });
    return;
  }

  const commandName = setup.name;
  const command = commands.get(commandName);
  if (!command) {
    await bot.sendMessage(chatId, `Cannot find command: ${commandName}`, { parse_mode: "Markdown" });
    return;
  }

  if (!command.onReply) {
    await bot.sendMessage(chatId, `Command ${commandName} doesn't support replies`, { parse_mode: "Markdown" });
    return;
  }

  try {
    await command.onReply({
      bot,
      msg,
      chatId,
      userId,
      args,
      data,
      commandName,
      replyMsg: msg.reply_to_message,
      message: msg,
    });
  } catch (err) {
    const errorMessage = `An error occurred while processing your reply: ${err.message}`;
    await bot.sendMessage(chatId, errorMessage, { parse_mode: "Markdown" });
  } finally {
    // Do NOT delete the reply context—allowing the user to reply any time
    // as long as the original command list message remains.
    // replies.delete(msg.reply_to_message.message_id);
  }
};