exports.setup = {
 name: "goodbye",
 description: "Handles members leaving the group and sends goodbye messages.",
 type: "leave",
 author: "AjiroDesu"
};

exports.onStart = async function({ bot, msg }) {
 const chatId = msg.chat.id;
 const leftMember = msg.left_chat_member;

 try {
   if (!leftMember) return;

   const { first_name, last_name, id: userId } = leftMember;
   const fullName = `${first_name}${last_name ? ' ' + last_name : ''}`;

   // Get bot info to check if bot was removed
   const botInfo = await bot.getMe();

   // Handle bot removal
   if (userId === botInfo.id) {
     const chatInfo = await bot.getChat(chatId);
     const title = chatInfo.title || 'the group';
     const actionBy = `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}`;

     console.log(`Bot was removed from ${title} by ${actionBy}.`);
     return;
   }

   // Get current member count
   const memberCount = (await bot.getChatMemberCount(chatId)) - 1;

   // Get user's profile photo
   const profilePhotos = await bot.getUserProfilePhotos(userId);
   let photoUrl = 'https://i.imgur.com/xwCoQ5H.jpeg';

   if (profilePhotos.total_count > 0) {
     const fileId = profilePhotos.photos[0][0].file_id;
     const file = await bot.getFile(fileId);
     photoUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
   }

   // Generate goodbye image URL
   const goodbyeApiUrl = `${global.api.ajiro}/api/goodbye?` +
     `pp=${encodeURIComponent(photoUrl)}` +
     `&nama=${encodeURIComponent(fullName)}` +
     `&bg=${encodeURIComponent('https://i.ibb.co/4YBNyvP/images-76.jpg')}` +
     `&member=${memberCount}`;

   // Prepare goodbye message
   const goodbyeMessage = msg.from.id === userId
     ? `${fullName} has left the group. We'll miss you!`
     : `Goodbye, ${fullName}. You were removed by an admin.`;

   try {
     // Get goodbye image
     const response = await fetch(goodbyeApiUrl);
     const imageBuffer = await response.arrayBuffer();

     // Send goodbye message with image
     await bot.sendPhoto(chatId, Buffer.from(imageBuffer), {
       caption: goodbyeMessage
     });

   } catch (error) {
     console.log('Error generating goodbye image:', error);
     // Fallback to text-only message
     await bot.sendMessage(chatId, goodbyeMessage);
   }

 } catch (error) {
   console.log('Error in goodbye handler:', error);
   if (global.config?.admin) {
     await bot.sendMessage(global.config.admin,
       `Error in goodbye handler:\n${error.message}`
     );
   }
 }
};