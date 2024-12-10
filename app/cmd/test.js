export const config = {
  name: 'example',
  aliases: ['test', 'ex'],
  description: 'This is an example command with reply functionality',
  access: 'anyone', // Anyone can use this command
  usage: '[argument]',
  cooldown: 5, // 5 seconds cooldown
};

export const onCommand = async ({ bot, chatId, userId, msg, args, usages }) => {
  if (args.length === 0) {
    return usages();
  }

  const argument = args.join(' ');
  try {
    const sentMessage = await bot.sendMessage(
      chatId,
      `You provided the argument: ${argument}\nReply to this message with further input!`
    );

    // Save reply event
    global.client.replies.set(sentMessage.message_id, {
      commandName: 'example',
      userId: userId,
      argument: argument,
    });

  } catch (error) {
    console.error('Error in example command:', error);
    bot.sendMessage(chatId, 'An error occurred while processing your command. Please try again later.');
  }
};

export const onReply = async ({ bot, chatId, userId, msg, data }) => {
  const userReply = msg.text.trim();
  if (!userReply) {
    return bot.sendMessage(chatId, 'Please reply with valid text.');
  }

  try {
    await bot.sendMessage(chatId, `You replied: ${userReply}\nOriginal argument was: ${data.argument}`);
  } catch (error) {
    console.error('Error in example reply handler:', error);
    bot.sendMessage(chatId, 'An error occurred while processing your reply. Please try again later.');
  }
};