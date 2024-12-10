export const config = {
  name: "help",
  aliases: ["h"],
  author: "AjiroDesu",
  description: "Displays help information for commands.",
  usage: "<command|page|all>",
  cooldown: 5,
  access: "anyone",
  category: "system",
};

const COMMANDS_PER_PAGE = 10;

export const onCommand = async function({ bot, chatId, userId, args }) {
  const { commands } = global.client;
  const { admin, prefix, symbols } = global.config;
  const cleanArg = args[0]?.toLowerCase();

  if (cleanArg && commands.has(cleanArg)) {
    const cmdInfo = commands.get(cleanArg).config;
    const helpMessage = generateCommandInfo(cmdInfo, prefix);
    return bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  const pageNumber = Math.max(1, parseInt(cleanArg) || 1);
  const { helpMessage, inlineKeyboard } = generateHelpMessage(commands, userId, admin, pageNumber, cleanArg, prefix, symbols);
  await bot.sendMessage(chatId, helpMessage, {
    reply_markup: {
      inline_keyboard: inlineKeyboard
    }
  });
};

export const onButton = async function({ bot, chatId, userId, data }) {
  const { commands } = global.client;
  const { admin, prefix, symbols } = global.config;
  const pageNumber = Math.max(1, parseInt(data.page) || 1);
  const messageId = data.message_id;

  const { helpMessage, inlineKeyboard } = generateHelpMessage(commands, userId, admin, pageNumber, "", prefix, symbols);
  await bot.editMessageText(helpMessage, {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: {
      inline_keyboard: inlineKeyboard
    }
  });
};

function generateHelpMessage(commands, userId, admin, pageNumber, cleanArg, prefix, symbols) {
  const filteredCommands = getFilteredCommands(commands, userId, admin);
  const totalCommands = filteredCommands.length;
  const totalPages = Math.ceil(totalCommands / COMMANDS_PER_PAGE);

  if (cleanArg === "all" || cleanArg === "-all" || cleanArg === "-a") {
    return {
      helpMessage: generateAllCommandsMessage(filteredCommands, prefix, symbols),
      inlineKeyboard: []
    };
  }

  if (pageNumber > totalPages) {
    return {
      helpMessage: `Invalid page number. Please use a number between 1 and ${totalPages}.`,
      inlineKeyboard: []
    };
  }

  const start = (pageNumber - 1) * COMMANDS_PER_PAGE;
  const paginatedCommands = filteredCommands.slice(start, start + COMMANDS_PER_PAGE)
    .map(cmd => `${symbols} ${prefix}${cmd.config.name}`);

  return {
    helpMessage: `List of Commands\n\n${paginatedCommands.join('\n')}\n\nPage: ${pageNumber}/${totalPages} \nTotal Cmds: ${totalCommands}`,
    inlineKeyboard: createInlineKeyboard(pageNumber, totalPages)
  };
}

function getFilteredCommands(commands, userId, admin) {
  const isAdmin = admin.includes(userId.toString());

  return [...commands.values()].filter(cmd => {
    const accessLevel = cmd.config.access || 'anyone';
    const category = cmd.config.category || 'misc';
    if (isAdmin) {
      // Admin/owner can see all commands
      return true;
    } else if (accessLevel === 'administrator') {
      // Group administrator can see all commands except those with access 'admin' or 'owner', and category 'owner'
      return !(accessLevel === 'admin' || accessLevel === 'owner' || category === 'owner');
    } else {
      // Normal users can't see commands with access 'admin', 'owner', or 'administrator', or categories 'owner' or 'administrator'
      return !(
        accessLevel === 'admin' ||
        accessLevel === 'owner' ||
        accessLevel === 'administrator' ||
        category === 'owner' ||
        category === 'administrator'
      );
    }
  }).sort((a, b) => a.config.name.localeCompare(b.config.name));
}

function generateAllCommandsMessage(filteredCommands, prefix, symbols) {
  const categories = filteredCommands.reduce((acc, cmd) => {
    const category = cmd.config.category || "misc";
    acc[category] = acc[category] || [];
    acc[category].push(`│➥ ${prefix}${cmd.config.name}`);
    return acc;
  }, {});

  const formattedCategories = Object.keys(categories).map(category => {
    return `╭─────────────────●\n│ ${capitalize(category)}\n├───● \n${categories[category].join("\n")}\n╰─────────────────●`;
  }).join("\n");

  const totalCommands = filteredCommands.length;

  return `${formattedCategories}\n\nTotal Commands: ${totalCommands}`;
}

function createInlineKeyboard(currentPage, totalPages) {
  const inlineKeyboard = [];
  if (currentPage > 1) inlineKeyboard.push({ text: 'Previous', callback_data: JSON.stringify({ command: 'help', page: currentPage - 1 }) });
  if (currentPage < totalPages) inlineKeyboard.push({ text: 'Next', callback_data: JSON.stringify({ command: 'help', page: currentPage + 1 }) });
  return [inlineKeyboard];
}

function generateCommandInfo(cmdInfo, prefix) {
  const aliases = cmdInfo.aliases?.length
    ? `Aliases:\n[ ${cmdInfo.aliases.join(", ")} ]`
    : "Aliases:\nNone";
  const usageList = Array.isArray(cmdInfo.usage)
    ? cmdInfo.usage.map(u => `\`${prefix}${cmdInfo.name} ${u}\``).join('\n')
    : `\`${prefix}${cmdInfo.name} ${cmdInfo.usage}\``;

  return `/${cmdInfo.name}  \n` // No underscores for formatting
    + `${cmdInfo.description}\n\n`
    + `Usage:\n${usageList}\n\n`
    + `Category:\n${cmdInfo.category}\n\n`
    + `Cooldowns:\n${cmdInfo.cooldown || 0} seconds\n\n`
    + `Access:\n${cmdInfo.access}\n\n`
    + `${aliases}`;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
