exports.setup = {
  name: "welcome",
  description: "Handles new members joining the group and sends welcome messages.",
  type: "welcome",
  author: "Ajirodesu"
};

exports.onStart = async function({ bot, msg }) {
  const chatId = msg.chat.id;
  const newMembers = msg.new_chat_members;

  try {
    if (!newMembers) return;

    // Get bot info
    const botInfo = await bot.getMe();
    const chatInfo = await bot.getChat(chatId);
    const title = chatInfo.title || "the group";

    // Check if bot was added
    const isBotAdded = newMembers.some(member => member.id === botInfo.id);

    if (isBotAdded) {
      const chatMember = await bot.getChatMember(chatId, botInfo.id);

      if (chatMember.status !== 'administrator') {
        await bot.sendMessage(chatId, 
          `🎉 ${botInfo.first_name} has been successfully connected!\n\n` +
          `Thank you for inviting me to ${title}. To unlock my full range of features, ` +
          `please consider granting me admin privileges.`
        );
      }
      return;
    }

    // Handle regular member joins
    for (const newMember of newMembers) {
      const memberName = `${newMember.first_name}${newMember.last_name ? ' ' + newMember.last_name : ''}`;
      const memberCount = await bot.getChatMemberCount(chatId);

      // Get member's profile photo
      const profilePhotos = await bot.getUserProfilePhotos(newMember.id);
      let avatarUrl = 'https://i.imgur.com/xwCoQ5H.jpeg';

      if (profilePhotos.total_count > 0) {
        const photoFileId = profilePhotos.photos[0][0].file_id;
        const file = await bot.getFile(photoFileId);
        avatarUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      }

      try {
        // Generate welcome image
        const apiUrl = `${global.api.ajiro}/api/welcome?` + 
          `username=${encodeURIComponent(memberName)}` +
          `&avatarUrl=${encodeURIComponent(avatarUrl)}` +
          `&groupname=${encodeURIComponent(title)}` +
          `&bg=https://i.ibb.co/4YBNyvP/images-76.jpg` +
          `&memberCount=${memberCount}`;

        const response = await fetch(apiUrl);
        const imageBuffer = await response.arrayBuffer();

        // Send welcome message with image
        await bot.sendPhoto(chatId, Buffer.from(imageBuffer), {
          caption: `Hi ${memberName}, Welcome to ${title}. Please enjoy your time here! 🥳♥`
        });

      } catch (error) {
        console.log('Error generating welcome image:', error);
        // Fallback to text-only welcome
        await bot.sendMessage(chatId, 
          `Hi ${memberName}, Welcome to ${title}. Please enjoy your time here! 🥳♥`
        );
      }
    }

  } catch (error) {
    console.log('Error in welcome handler:', error);
    if (global.config?.admin) {
      await bot.sendMessage(global.config.admin, 
        `Error in welcome handler:\n${error.message}`
      );
    }
  }
};