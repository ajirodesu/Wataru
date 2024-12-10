import axios from 'axios';

export const config = {
  name: "profile",
  aliases: [],
  author: "Samir",
  description: "Fetches profile image",
  usage: ["profile [username|user_id]", "profile (reply to a user message)"],
  cooldown: 0,
  access: 'anyone',
  category: "utility"
};

export const onCommand = async function({ bot, chatId, args, message }) {
  let targetUserId = message.from.id;
  
  // Check if the command is a reply to another user's message
  if (message.reply_to_message) {
    targetUserId = message.reply_to_message.from.id;
  } else if (args.length > 0) {
    targetUserId = args[0];
  }

  try {
    const username = await bot.getChat(targetUserId);
    const photos = await bot.getUserProfilePhotos(targetUserId);

    if (photos.total_count === 0) {
      return bot.sendMessage(chatId, "No Profile Image Found");
    }

    const fileId = photos.photos[0][0].file_id;
    await bot.sendPhoto(chatId, fileId, { caption: `Profile image of ${username.username}` });
  } catch (error) {
    try {
      const fallbackPhotos = await bot.getUserProfilePhotos(message.from.id);
      if (fallbackPhotos.total_count === 0) {
        return bot.sendMessage(chatId, "No Profile Image Found");
      }

      const fallbackFileId = fallbackPhotos.photos[0][0].file_id;
      await bot.sendPhoto(chatId, fallbackFileId, { caption: "Your Profile Image" });
    } catch (fallbackError) {
      await bot.sendMessage(chatId, "An error occurred while fetching the profile image.");
    }
  }
};
