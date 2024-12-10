export const config = {
  name: 'join',
  author: 'Lance Cochangco',
  access: 'anyone',
  description: 'Join a group where the bot is present.',
  category: 'Utility',
  usage: ['join'],
};

export const onCommand = async ({ bot, chatId, userId, msg, db }) => {
  await db.load();  // Ensure the database is loaded

  const groupIds = db.getAllGroupIds();  // Fetch all group IDs from the database
  const groupList = await Promise.all(
    groupIds.map(async (id, index) => {
      let name;
      try {
        const chat = await bot.getChat(id);  // Fetch the group name from the bot
        name = chat.title;
      } catch (error) {
        console.error(`Error fetching group name for ${id}:`, error);
        name = `Group ${index + 1}`;
      }
      return {
        index: index + 1,
        id,
        name,
      };
    })
  );

  if (groupList.length === 0) {
    await bot.sendMessage(chatId, "No groups found in the database.");
    return;
  }

  let message = "Please reply with the number of the group you want to join:\n\n";
  groupList.forEach(group => {
    message += `${group.index}. ${group.name}\n`;
  });

  try {
    const sentMessage = await bot.sendMessage(chatId, message);
    
    // Save reply event
    global.client.replies.set(sentMessage.message_id, {
      commandName: 'join',
      userId: userId,
      groupList: groupList,  // Store the group list to reference in onReply
    });
  } catch (error) {
    console.error("Error sending group list:", error);
    await bot.sendMessage(chatId, "An error occurred while processing your request. Please try again later.");
  }
};

export const onReply = async ({ bot, chatId, userId, msg, data }) => {
  const userReply = msg.text.trim();
  const selectedNumber = parseInt(userReply);

  if (isNaN(selectedNumber) || selectedNumber < 1 || selectedNumber > data.groupList.length) {
    await bot.sendMessage(chatId, "Invalid selection. Please reply with a valid number.");
    return;
  }

  const selectedGroup = data.groupList[selectedNumber - 1];

  try {
    const inviteLink = await bot.exportChatInviteLink(selectedGroup.id);  // Get invite link for the group
    await bot.sendMessage(chatId, `Click the link to join the group "${selectedGroup.name}": ${inviteLink}`);
  } catch (error) {
    console.error("Error generating invite link:", error);
    let errorMessage = "An error occurred while processing your request.";
    if (error.response && error.response.status === 403) {
      errorMessage += " The bot might not have the necessary permissions to generate an invite link.";
    }
    await bot.sendMessage(chatId, errorMessage);
  }
};
