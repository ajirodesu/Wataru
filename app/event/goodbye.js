import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const config = {
  name: 'goodbye',
  description: 'Handles members leaving the group and sends goodbye messages.',
};

export const onEvent = async ({ bot, chatId, msg, log }) => {
  try {
    const { id } = await bot.getMe();

    if (msg.left_chat_member) {
      const { first_name, last_name, id: userId } = msg.left_chat_member;
      const fullName = `${first_name}${last_name ? ' ' + last_name : ''}`;

      // Fetch the current member count of the chat and subtract 1 for the member leaving
      let memberCount = await bot.getChatMemberCount(chatId);

      if (msg.left_chat_member.id === id) {
        try {
          const chatInfo = await bot.getChat(chatId);
          const title = chatInfo.title || "the group";
          const actionBy = `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}`;

          log.warn(`Bot was removed from ${title} by ${actionBy}.`);
        } catch (error) {
          log.warn('Error handling bot removal: ' + error.message);
        }
      } else {
        // Fetch user profile photos
        const profilePhotos = await bot.getUserProfilePhotos(userId);

        let photoUrl = 'https://i.imgur.com/xwCoQ5H.jpeg'; // Fallback image if no profile photo
        if (profilePhotos.total_count > 0) {
          const fileId = profilePhotos.photos[0][0].file_id; // Get the first profile photo
          const file = await bot.getFile(fileId); // Get the file details
          photoUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`; // Construct the file URL
        }

        const bgUrl = 'https://i.ibb.co/4YBNyvP/images-76.jpg';

        // Generate the goodbye image URL with the dynamic member count
        const goodbyeApiUrl = `${global.api.ajiro}/api/goodbye?pp=${photoUrl}&nama=${encodeURIComponent(fullName)}&bg=${bgUrl}&member=${memberCount}`;

        const goodbyeMessage = msg.from.id === msg.left_chat_member.id
          ? `${fullName} has left the group. We'll miss you!`
          : `Goodbye, ${fullName}. You were removed by an admin.`;

        const response = await axios.get(goodbyeApiUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        
        const cachePath = path.join(process.cwd(), 'app', 'temp');
        if (!fs.existsSync(cachePath)) {
          fs.mkdirSync(cachePath, { recursive: true });
        }
        
        const filePath = path.join(cachePath, `goodbye_${fullName}.jpeg`);
        fs.writeFileSync(filePath, buffer);

        await bot.sendPhoto(chatId, filePath, { caption: goodbyeMessage });
      }
    }
  } catch (error) {
    log.error('Error handling goodbye event:\n' + error.message);
  }
};
