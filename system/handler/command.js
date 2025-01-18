import fs from 'fs';
import bot from './login.js';

export const help = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: 'View Commands',
          callback_data: JSON.stringify({ command: 'help', page: 1 }),
        },
      ],
    ],
  },
};

global.help = help;

// Ensure `vip.json` only contains an array of user IDs
try {
  global.vip = JSON.parse(fs.readFileSync('./setup/vip.json', 'utf-8')) || [];
  if (!Array.isArray(global.vip)) {
    throw new Error('Invalid VIP format. VIP data must be an array of user IDs.');
  }
} catch (err) {
  console.error('Failed to load VIP data:', err.message);
  global.vip = [];
}

export const command = async ({ bot, msg, chatId, userId, log, db }) => {
  const { commands, cooldowns } = global.client;
  const { admin, prefix } = global.config;

  const sendHelpButton = async (bot, chatId, message) => {
    return bot.sendMessage(chatId, message, { reply_markup: help.reply_markup });
  };

  const botInfo = await bot.getMe();
  const botUsername = botInfo.username;

  const prefixRegex = new RegExp(`^(${prefix}|@${botUsername}\\s*)`, 'i');
  const prefixMatch = msg.text?.trim().match(prefixRegex);

  if (!prefixMatch) return;

  const usedPrefix = prefixMatch[0];
  const [fullCommand, ...args] = msg.text.trim().slice(usedPrefix.length).split(/\s+/);
  const [commandName, targetUsername] = fullCommand.split('@');
  const cleanCommandName = commandName?.toLowerCase();

  if (targetUsername && targetUsername.toLowerCase() !== botUsername.toLowerCase()) return;

  if (!cleanCommandName) {
    return sendHelpButton(bot, chatId, `Please specify a command. Click the button below to view available commands.`);
  }

  const cmdFile = commands.get(cleanCommandName) ||
    [...commands.values()].find(cmd =>
      Array.isArray(cmd.setup?.aliases) && cmd.setup.aliases.map(a => a.toLowerCase()).includes(cleanCommandName)
    );

  if (!cmdFile) {
    return sendHelpButton(bot, chatId, `The command "${cleanCommandName}" does not exist. Click the button below to view available commands.`);
  }

  const { setup, onStart } = cmdFile;

  const hasAccess = async (accessLevel) => {
    switch (accessLevel) {
      case 'anyone':
        return { hasAccess: true };

      case 'group': {
        const isGroup = msg.chat.type.endsWith('group');
        return isGroup
          ? { hasAccess: true }
          : { hasAccess: false, message: `The command "${cleanCommandName}" can only be used in groups.` };
      }

      case 'private': {
        const isPrivate = msg.chat.type === 'private';
        return isPrivate
          ? { hasAccess: true }
          : { hasAccess: false, message: `The command "${cleanCommandName}" can only be used in private chats.` };
      }

      case 'administrator': {
        const chatAdmins = await bot.getChatAdministrators(chatId);
        const isAdmin = chatAdmins.some(admin => admin.user.id === userId);
        return isAdmin
          ? { hasAccess: true }
          : { hasAccess: false, message: `You don't have permission to use "${cleanCommandName}". Only group admins can use it.` };
      }

      case 'vip': {
        const isVip = global.vip.includes(userId.toString());
        return isVip
          ? { hasAccess: true }
          : { hasAccess: false, message: `The command "${cleanCommandName}" is restricted to VIP users.` };
      }

      case 'admin': {
        const isAdmin = admin.includes(userId.toString());
        return isAdmin
          ? { hasAccess: true }
          : { hasAccess: false, message: `The command "${cleanCommandName}" is restricted to the bot creator/operator.` };
      }

      default:
        return { hasAccess: false, message: `Invalid access level for command "${cleanCommandName}".` };
    }
  };

  const type = await hasAccess(setup?.type || 'anyone');
  if (!type.hasAccess) {
    return bot.sendMessage(chatId, type.message);
  }

  const now = Date.now();
  const cooldownKey = `${userId}_${cleanCommandName}`;
  const cooldownTime = setup?.cooldown ?? 0;
  const cooldownExpiration = cooldowns.get(cooldownKey) ?? 0;

  if (now < cooldownExpiration) {
    const secondsLeft = Math.ceil((cooldownExpiration - now) / 1000);
    return bot.sendMessage(chatId, `Please wait ${secondsLeft}s before using this command again.`);
  }

  cooldowns.set(cooldownKey, now + cooldownTime * 1000);

  try {
    await onStart({
      cmdName: cleanCommandName,
      message: msg,
      chatId,
      userId,
      bot,
      args,
      log,
      usages: () => {},
      help,
      db,
    });
  } catch (error) {
    log.error(error);
    await bot.sendMessage(chatId, `An error occurred while executing the command: ${error.message}`);
  }
};

const handleCallbackQuery = async (callbackQuery) => {
  const {
    message: { chat: { id: chatId }, message_id: messageId },
    from: { id: userId },
    data,
  } = callbackQuery;

  const { command: commandName, ...extraData } = JSON.parse(data);

  if (commandName === 'help') {
    const helpCommand = global.client.commands.get('help');
    if (helpCommand?.onButton) {
      await helpCommand.onButton({ bot, chatId, userId, data: { ...extraData, message_id: messageId } });
    } else {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Help command is unavailable.', show_alert: true });
    }
  } else {
    await bot.answerCallbackQuery(callbackQuery.id, { text: 'Unknown callback action.', show_alert: true });
  }
};

bot.on('callback_query', handleCallbackQuery);

export default command;
