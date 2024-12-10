export const config = {
  name: "stalk",
  aliases: ["info", "userinfo"],
  author: "Lance Cochangco",
  description: "Get detailed information about a user with their profile picture.",
  usage: ["", "@username", "replied to other user's message"],
  access: 'anyone',
  cooldown: 5,
  category: "utility"
};

export const onCommand = async function({ message, bot, chatId, userId, args, log }) {
  try {
    let targetUser;

    if (message.reply_to_message) {
      targetUser = message.reply_to_message.from;
    } 
    else if (args.length > 0) {
      const username = args[0].replace('@', '');
      try {
        const chatMember = await bot.getChatMember(chatId, `@${username}`);
        targetUser = chatMember.user;
      } catch (error) {
        await bot.sendMessage(chatId, `User @${username} not found in this chat.`);
        return;
      }
    } 
    else {
      targetUser = message.from;
    }

    const userInfo = await bot.getUserProfilePhotos(targetUser.id, 0, 1);
    const chatMember = await bot.getChatMember(chatId, targetUser.id);

    let infoMessage = `👤 User Information:\n\n`;
    infoMessage += `🆔 User ID: ${targetUser.id}\n`;
    infoMessage += `👤 Name: ${targetUser.first_name}${targetUser.last_name ? ' ' + targetUser.last_name : ''}\n`;
    infoMessage += `🏷️ Username: ${targetUser.username ? '@' + targetUser.username : 'Not set'}\n`;
    infoMessage += `🤖 Is Bot: ${targetUser.is_bot ? 'Yes' : 'No'}\n`;
    infoMessage += `🚦 User Status: ${chatMember.status}\n`;

    if (chatMember.status === 'administrator' || chatMember.status === 'creator') {
      infoMessage += `\n👑 Admin Status:\n`;
      infoMessage += `- Administrator: ✅\n`;
    }

    if (userInfo.total_count > 0) {
      const photoFile = userInfo.photos[0][0].file_id;
      await bot.sendPhoto(chatId, photoFile, { caption: infoMessage });
    } else {
      await bot.sendPhoto(chatId, 'https://example.com/default-profile-picture.jpg', { caption: infoMessage });
    }
  } catch (error) {
    log.error("Error executing stalk command:", error);
    await bot.sendMessage(chatId, `An error occurred: ${error.message}`);
  }
};

String.prototype.capitalize = function() {
  return this.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};