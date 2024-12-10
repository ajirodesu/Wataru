import bot from './login.js';
import log from '../utility/log.js';

const help = {
  reply_markup: {
    inline_keyboard: [[
      { text: "View Commands", callback_data: JSON.stringify({ command: 'help', page: 1 }) }
    ]]
  }
};

global.help = help;

export const command = async ({ bot, msg, chatId, userId, db }) => {
  const { commands, cooldowns } = global.client;
  const { admin, prefix } = global.config;

  const sendHelpButton = async (bot, chatId, message) => {
    return bot.sendMessage(chatId, message, help);
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

  if (usedPrefix.startsWith('@') && usedPrefix.toLowerCase().includes(botUsername.toLowerCase())) {
    const wataruCommand = commands.get('wataru');
    if (wataruCommand?.onCommand) {
      return wataruCommand.onCommand({
        cmdName: 'wataru',
        message: msg,
        chatId,
        userId,
        bot,
        args: [fullCommand, ...args],
        log,
        usages: () => {},
        help,
        db
      });
    }
  }

  if (!cleanCommandName) {
    return sendHelpButton(bot, chatId, `Please specify a command. Click the button below to view available commands.`);
  }

  const cmdFile = commands.get(cleanCommandName) ||
    [...commands.values()].find(cmd =>
      (Array.isArray(cmd.config?.aliases) && cmd.config.aliases.map(a => a.trim().toLowerCase()).includes(cleanCommandName)) ||
      (typeof cmd.config?.aliases === 'string' && cmd.config.aliases.split(',').map(a => a.trim().toLowerCase()).includes(cleanCommandName))
    );

  if (!cmdFile) {
    return sendHelpButton(bot, chatId, `The command "${cleanCommandName}" does not exist. Click the button below to view available commands.`);
  }

  const { config, onCommand } = cmdFile;

  if (config?.category === 'group' && config?.access === 'admin' && msg.chat.type === 'private') {
    return bot.sendMessage(chatId, "This command is not available in private chats.");
  }

  const hasAccess = async (accessLevel) => {
    if (accessLevel === 'anyone') return { hasAccess: true };
    if (accessLevel === 'administrator') {
      const chatAdmins = await bot.getChatAdministrators(chatId);
      const isAdmin = chatAdmins.some(admin => admin.user.id === userId);
      return isAdmin
        ? { hasAccess: true }
        : { hasAccess: false, message: `You don't have permission to use ${cleanCommandName}. Only group admins can use it.` };
    }
    if (accessLevel === 'admin') {
      return admin.includes(userId.toString())
        ? { hasAccess: true }
        : { hasAccess: false, message: `You don't have permission to use '${cleanCommandName}'. Only the system admin can use it.` };
    }
    return { hasAccess: false, message: `Invalid access level for command ${cleanCommandName}.` };
  };

  const access = await hasAccess(config?.access);
  if (!access.hasAccess) {
    return bot.sendMessage(chatId, access.message);
  }

  const now = Date.now();
  const cooldownKey = `${userId}_${cleanCommandName}`;
  const cooldownTime = config?.cooldown ?? 0;
  const cooldownExpiration = cooldowns.get(cooldownKey) ?? 0;
  if (now < cooldownExpiration) {
    const secondsLeft = Math.ceil((cooldownExpiration - now) / 1000);
    return bot.sendMessage(chatId, `Please wait ${secondsLeft}s before using this command again.`);
  }

  cooldowns.set(cooldownKey, now + cooldownTime * 1000);

  const usages = () => {
    let usageMessage = `${global.config.symbols} Usage:\n`;

    if (Array.isArray(config?.usage)) {
      config.usage.forEach(usage => {
        usageMessage += `${usedPrefix}${config.name} ${usage}\n`;
      });
    } else if (typeof config?.usage === 'string') {
      usageMessage += `${usedPrefix}${config.name} ${config.usage}\n`;
    }

    const fullInfoButton = {
      reply_markup: {
        inline_keyboard: [[
          { text: "Full Info", callback_data: JSON.stringify({ command: `fullInfo_${config.name}` }) }
        ]]
      }
    };

    bot.sendMessage(chatId, usageMessage.trim(), fullInfoButton);
  };

  try {
    await onCommand({
      cmdName: cleanCommandName,
      message: msg,
      chatId,
      userId,
      bot,
      args,
      log,
      usages,
      help,
      db
    });
  } catch (error) {
    log.error(error);
    await bot.sendMessage(chatId, `An error occurred while executing the command` + `${error.message}`);
  }

  if (prefix === '/') {
  const commandList = Array.from(commands.values())
    .filter(cmd => !(cmd.config?.access === 'admin' && cmd.config?.category === 'owner'))
    .map(cmd => ({
      command: cmd.config?.name,
      description: cmd.config?.description,
    }));

  try {
    await bot.setMyCommands(commandList);
  } catch (error) {
    log.error(`Failed to set bot commands: ${error.message}`);
  }
} else {
  // If the prefix is not '/', clear the bot menu
  try {
    await bot.setMyCommands([]);
  } catch (error) {
    log.error(`Failed to clear bot commands: ${error.message}`);
   }
  }
};

const generateCommandInfo = (cmdInfo, prefix, botUsername) => {
  const aliases = cmdInfo.aliases?.length
    ? `Aliases:\n[ ${cmdInfo.aliases.join(", ")} ]`
    : "Aliases:\nNone";

  const usageList = Array.isArray(cmdInfo.usage)
    ? cmdInfo.usage.map(u => `\`${prefix}${cmdInfo.name} ${u}\``)
    : `\`${prefix}${cmdInfo.name} ${cmdInfo.usage}\``;

  return `/${cmdInfo.name}  \n`
    + `${cmdInfo.description}\n\n`
    + `Usage:\n${usageList}\n\n`
    + `Category:\n${cmdInfo.category}\n\n`
    + `Cooldowns:\n${cmdInfo.cooldown ?? 0} seconds\n\n`
    + `Access:\n${cmdInfo.access}\n\n`
    + `${aliases}`;
};

const handleCallbackQuery = async (callbackQuery) => {
  const { message: { chat: { id: chatId }, message_id: messageId, text: currentText }, from: { id: userId }, data } = callbackQuery;
  const { command: commandName, ...extraData } = JSON.parse(data);

  if (commandName === 'help') {
    const helpCommand = global.client.commands.get('help');
    if (helpCommand?.onButton) {
      await helpCommand.onButton({ bot, chatId, userId, log, data: { ...extraData, message_id: messageId } });
    } else {
      const newText = 'Sorry, the help command is not available.';
      if (newText !== currentText) {
        await bot.editMessageText(newText, {
          chat_id: chatId,
          message_id: messageId
        });
      } else {
        await bot.answerCallbackQuery(callbackQuery.id);
      }
    }
  } else if (commandName.startsWith('fullInfo_')) {
    const specificCommandName = commandName.split('_')[1];
    const specificCommand = global.client.commands.get(specificCommandName);
    if (specificCommand) {
      const info = await bot.getMe();
      const username = info.username;
      const fullInfo = generateCommandInfo(specificCommand.config, global.config.prefix, username);
      if (fullInfo !== currentText) {
        await bot.editMessageText(fullInfo, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown'
        });
      } else {
        await bot.answerCallbackQuery(callbackQuery.id);
      }
    } else {
      const newText = 'Sorry, the command information is not available.';
      if (newText !== currentText) {
        await bot.editMessageText(newText, {
          chat_id: chatId,
          message_id: messageId
        });
      } else {
        await bot.answerCallbackQuery(callbackQuery.id);
      }
    }
  } else {
    
    const command = global.client.commands.get(commandName);
    if (command?.onButton) {
      await command.onButton({ bot, chatId, userId, log, data: { ...extraData, message_id: messageId } });
    } else {
      const newText = 'Sorry, something went wrong with your selection.';
      if (newText !== currentText) {
        await bot.editMessageText(newText, {
          chat_id: chatId,
          message_id: messageId
        });
      } else {
        await bot.answerCallbackQuery(callbackQuery.id);
      }
    }
  }
};

bot.on('callback_query', handleCallbackQuery);

export default command;