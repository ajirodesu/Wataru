import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const setup = {
  name: 'goodbye',
  version: '0.0.1',
  description: 'Handles members leaving the group and sends goodbye messages.',
  author: 'AjiroDesu',
};

export const onEvent = async ({ bot, chatId, msg, log }) => {
  try {
    const { id: botId } = await bot.getMe();

    if (msg.left_chat_member) {
      const { first_name, last_name, id: userId } = msg.left_chat_member;
      const fullName = `${first_name}${last_name ? ' ' + last_name : ''}`;

      // Fetch the current member count of the chat
      const memberCount = (await bot.getChatMemberCount(chatId)) - 1;

      if (userId === botId) {
        // Handle bot removal from the group
        try {
          const chatInfo = await bot.getChat(chatId);
          const title = chatInfo.title || 'the group';
          const actionBy = `${msg.from.first_name}${
            msg.from.last_name ? ' ' + msg.from.last_name : ''
          }`;

          log.warn(`Bot was removed from ${title} by ${actionBy}.`);
        } catch (error) {
          log.warn('Error handling bot removal: ' + error.message);
        }
      } else {
        // Fetch user profile photos
        const profilePhotos = await bot.getUserProfilePhotos(userId);
        let photoUrl = 'https://i.imgur.com/xwCoQ5H.jpeg'; // Fallback image
        if (profilePhotos.total_count > 0) {
          const fileId = profilePhotos.photos[0][0].file_id; // First profile photo
          const file = await bot.getFile(fileId);
          photoUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
        }

        const bgUrl = 'https://i.ibb.co/4YBNyvP/images-76.jpg';

        // Generate the goodbye image URL with the dynamic member count
        const goodbyeApiUrl = `${global.api.ajiro}/api/goodbye?pp=${photoUrl}&nama=${encodeURIComponent(
          fullName
        )}&bg=${encodeURIComponent(bgUrl)}&member=${memberCount}`;

        const goodbyeMessage =
          msg.from.id === userId
            ? `${fullName} has left the group. We'll miss you!`
            : `Goodbye, ${fullName}. You were removed by an admin.`;

        try {
          // Fetch and save the goodbye image
          const response = await axios.get(goodbyeApiUrl, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(response.data, 'binary');

          const cachePath = path.resolve('app', 'temp');
          if (!fs.existsSync(cachePath)) {
            fs.mkdirSync(cachePath, { recursive: true });
          }

          const filePath = path.join(cachePath, `goodbye_${Date.now()}.jpeg`);
          fs.writeFileSync(filePath, buffer);

          // Send the goodbye image
          await bot.sendPhoto(chatId, filePath, { caption: goodbyeMessage });

          // Clean up temporary file
          fs.unlinkSync(filePath);
        } catch (error) {
          log.error(`Error generating goodbye image: ${error.message}`);
          // Send only the text message as a fallback
          await bot.sendMessage(chatId, goodbyeMessage);
        }
      }
    }
  } catch (error) {
    log.error('Error handling goodbye event:\n' + error.message);
  }
};
