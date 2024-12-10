import fs from 'fs';
import path from 'path';
import axios from 'axios';

export const config = {
  name: 'welcome',
  description: 'Handles new members joining the group and sends welcome messages.',
};

export const onEvent = async ({ bot, chatId, msg, log, db }) => {
  try {
    // Destructure necessary values from global.config
    const { symbols, prefix } = global.config;
    const { id, first_name } = await bot.getMe(); // Retrieve bot information

    if (msg.new_chat_members) {
      const chatInfo = await bot.getChat(chatId); // Fetch the chat information
      const title = chatInfo.title || "the group"; // Use a fallback if the title is undefined

      // Check if the bot itself is one of the new members
      const isBotAdded = msg.new_chat_members.some(member => member.id === id);

      if (isBotAdded) {
        const actionBy = `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}`;
        const chatMember = await bot.getChatMember(chatId, id);

        if (chatMember.status !== 'administrator') {
          const botname = first_name;
          const symbol = symbols;
          const help = global.help;
          await bot.sendMessage(chatId, `🎉 ${botname} has been successfully connected!

Thank you for inviting me to ${title}. To unlock my full range of features, please consider granting me admin privileges.

${symbol} Available Commands: ${global.client.commands.size}
${symbol} Available Events: ${global.client.events.size}
${symbol} Total Users: ${db.getAllUserIds().length}
${symbol} Total Groups: ${db.getAllGroupIds().length}
            
Click the button below to explore the commands I can assist you with. Let's make this chat even better together!`, help);
        }
      } else {
        const newMember = msg.new_chat_members[0];
        const newMemberName = `${newMember.first_name}${newMember.last_name ? ' ' + newMember.last_name : ''}`;
        const memberCount = await bot.getChatMemberCount(chatId);

        // Fetch the new member's profile photos
        const profilePhotos = await bot.getUserProfilePhotos(newMember.id);

        let avatarUrl = 'https://i.imgur.com/xwCoQ5H.jpeg'; // Default avatar URL

        // If the user has a profile photo, get the first one
        if (profilePhotos.total_count > 0) {
          const photoFileId = profilePhotos.photos[0][0].file_id; // Get the file_id of the first photo
          const file = await bot.getFile(photoFileId); // Get the file path of the photo
          avatarUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`; // Construct the URL to access the profile photo
        }

        // Prepare the welcome image API URL with the actual profile photo
        const apiUrl = `${global.api.ajiro}/api/welcome?username=${encodeURIComponent(newMemberName)}&avatarUrl=${encodeURIComponent(avatarUrl)}&groupname=${encodeURIComponent(title)}&bg=https://i.ibb.co/4YBNyvP/images-76.jpg&memberCount=${memberCount}`;

        try {
          // Call the API to generate the image
          const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

          // Define the cache directory and save the image temporarily
          const cacheDir = path.join(process.cwd(), 'app', 'temp');
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }

          const filePath = path.join(cacheDir, `welcome_${chatId}_${Date.now()}.png`);
          fs.writeFileSync(filePath, response.data);

          // Send the image to the chat
          await bot.sendPhoto(chatId, filePath, {
            caption: `Hi ${newMemberName}, Welcome to ${title}. Please enjoy your time here! 🥳♥`,
          });

          // Delete the temporary image file after sending it
          fs.unlinkSync(filePath);
        } catch (apiError) {
          log.error('Error calling the API for welcome image:', apiError);
          await bot.sendMessage(chatId, `Hi ${newMemberName}, Welcome to ${title}. Please enjoy your time here! 🥳♥`);
        }
      }
    }
  } catch (error) {
    log.error('Error handling welcome event:\n' + error.message);
    await bot.sendMessage(global.config.admin, `An error occurred while processing the welcome event:\n\n${error.message}`);
  }
};
