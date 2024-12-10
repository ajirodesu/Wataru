// Command configuration
export const config = {
  name: "admin",
  access: "anyone",
  category: "system",
  description: "Admin management command",
  usage: "[add/list/remove]",
  author: "AjiroDesu"
};

// Command initialization
export const onCommand = async function ({ bot, chatId, message, args, usages }) {
  // Access the admins directly from global.config
  let admins = global.config.admin || [];
  let command = args[0];
  let targetId = args[1] || (message.reply_to_message ? message.reply_to_message.from.id : null);

  // Extract user ID from mentions if present
  if (message.reply_to_message && !targetId) {
    targetId = message.reply_to_message.from.id;
  } else if (args.length > 1) {
    targetId = args[1];
  }

  // Function to get user info by ID
  async function getUserInfo(userId) {
    try {
      const userInfo = await bot.getChat(userId);
      return userInfo;
    } catch (err) {
      console.error("Error fetching user info:", err);
      return null;
    }
  }

  // Handle the 'list' command
  if (command === "list") {
    if (admins.length === 0) {
      return bot.sendMessage(chatId, "There are currently no admins.");
    }
    let message = "List of System Admins:\n\n";
    for (let adminId of admins) {
      try {
        const userInfo = await getUserInfo(adminId);
        if (userInfo) {
          const name = userInfo.first_name + ' ' + (userInfo.last_name || '');
          message += `${global.config.symbols || ''} ${name}\nhttps://t.me/${userInfo.username || adminId}\n\n`;
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    }
    return bot.sendMessage(chatId, message);
  }

  // Handle the 'add' command
  if (command === "add" || command === "-a" || command === "a") {
    if (!admins.includes(message.from.id.toString())) {
      return bot.sendMessage(chatId, "You don't have permission to use this command. Only admins can use this method.");
    }
    let id = parseInt(targetId);
    if (isNaN(id)) {
      return bot.sendMessage(chatId, "⚠️ The ID provided is invalid.");
    }
    if (admins.includes(id.toString())) {
      return bot.sendMessage(chatId, "This user is already an admin.");
    }
    admins.push(id.toString());
    global.config.admin = admins; // Update the admin list in the global config
    const userInfo = await getUserInfo(id);
    const userName = userInfo ? `${userInfo.first_name} ${userInfo.last_name || ''}` : 'User';
    return bot.sendMessage(chatId, `${userName} has been successfully added as an admin.`);
  }

  // Handle the 'remove' command
  if (command === "remove" || command === "-r" || command === "r") {
    if (!admins.includes(message.from.id.toString())) {
      return bot.sendMessage(chatId, "You don't have permission to use this command. Only admins can use this method.");
    }
    if (admins.length === 0) {
      return bot.sendMessage(chatId, "There are no admins to remove.");
    }
    let id = parseInt(targetId);
    if (isNaN(id)) {
      return bot.sendMessage(chatId, "⚠️ The ID provided is invalid.");
    }
    if (!admins.includes(id.toString())) {
      return bot.sendMessage(chatId, "This user is not an admin.");
    }
    global.config.admin = admins.filter(a => a !== id.toString());
    const userInfo = await getUserInfo(id);
    const userName = userInfo ? `${userInfo.first_name} ${userInfo.last_name || ''}` : 'User';
    return bot.sendMessage(chatId, `${userName} has been successfully removed as an admin.`);
  }

  // Handle invalid or unknown commands
  return usages();
};
