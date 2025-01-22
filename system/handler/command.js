export const command = async ({ bot, msg, chatId, userId, userName, log, db }) => {
  const { commands, cooldowns } = global.client;
  const { admin, prefix } = global.config;

  try {
    if (!msg?.text || !commands || !cooldowns) return;

    const [rawCommand, ...args] = msg.text.trim().split(/\s+/);
    const command = rawCommand.toLowerCase();
    const hasPrefix = command.startsWith(prefix);
    const commandName = hasPrefix ? command.slice(prefix.length) : command;

    // Handle case where only the prefix is typed
    if (hasPrefix && !commandName) {
      return bot.sendMessage(chatId, `⚠️ | It seems you just typed the prefix "${prefix}" without a command. Try ${prefix}help to see available commands.`);
    }

    if (command === "prefix") return bot.sendMessage(chatId, `Current prefix: ${prefix}`);

    const cmdFile = commands.get(commandName);
    if (!cmdFile) {
      if (hasPrefix) bot.sendMessage(chatId, `❌ | Command "${commandName}" not found. Use ${prefix}help.`);
      return;
    }

    const { setup = {} } = cmdFile;
    if (!setup.name || !setup.type) throw new Error(`Invalid command configuration for "${commandName}"`);

    // Always validate chat type, even for bot admins
    if (!await validateChatType(setup.type, msg.chat.type, bot, chatId)) return;

    // Skip other restrictions (permissions and cooldowns) for bot admins
    if (!admin.includes(Number(userId))) {
      if (!await validatePermissions(setup.type, { bot, chatId, userId, db, admin })) return;
      if (setup.prefix !== false && !hasPrefix) return;

      const cooldownSuccess = await handleCooldown({ userId, commandName, setup, cooldowns, bot, chatId });
      if (!cooldownSuccess) return;
    }

    await cmdFile.onStart({ cmdName: commandName, bot, msg, chatId, userId, username: userName, db, args, log, setup, cooldowns });

  } catch (error) {
    log.error(`Error: ${error.message}`);
    bot.sendMessage(chatId, `❌ | ${error.message}`);
  }
};

/**
 * Validates chat type for command
 */
async function validateChatType(commandType, chatType, bot, chatId) {
  const errors = {
    group: '❌ | Command only for groups',
    private: '❌ | Command only for private chats'
  };
  if ((commandType === 'group' && chatType === 'private') || (commandType === 'private' && chatType !== 'private')) {
    await bot.sendMessage(chatId, errors[commandType]);
    return false;
  }
  return true;
}

/**
 * Validates permissions
 */
async function validatePermissions(commandType, { bot, chatId, userId, db, admin }) {
  if (commandType === 'administrator') {
    const member = await bot.getChatMember(chatId, userId);
    if (!['creator', 'administrator'].includes(member.status)) {
      await bot.sendMessage(chatId, '❌ | Admin privileges required');
      return false;
    }
  } else if (commandType === 'vip' && !db.getUser(userId)?.vip) {
    await bot.sendMessage(chatId, '❌ | VIP status required');
    return false;
  } else if (commandType === 'admin' && !admin.includes(Number(userId))) {
    await bot.sendMessage(chatId, '❌ | Restricted to bot admins');
    return false;
  }
  return true;
}

/**
 * Handles command cooldown
 */
async function handleCooldown({ userId, commandName, setup, cooldowns, bot, chatId }) {
  const now = Date.now();
  const key = `${userId}_${commandName}`;
  const cooldownTime = setup.cooldown || 0;

  if (cooldowns[key] && now < cooldowns[key]) {
    const timeLeft = Math.ceil((cooldowns[key] - now) / 1000);
    await bot.sendMessage(chatId, `❌ | Cooldown active: ${timeLeft}s left`);
    return false;
  }

  if (cooldownTime > 0) cooldowns[key] = now + cooldownTime * 1000;
  return true;
}

export default command;
