exports.setup = {
  name: "help",
  aliases: ["h"],
  version: "0.0.1",
  author: "AjiroDesu",
  description: "Displays help information for commands.",
  guide: "<command|page|all>",
  cooldown: 5,
  prefix: "both",
  type: "anyone",
  category: "system",
};

const COMMANDS_PER_PAGE = 10;

exports.onStart = async function({ bot, chatId, userId, args, msg }) {
  const { commands } = global.client;
  const { admin, prefix, symbols } = global.config;
  const vipUsers = global.vip.uid.includes(userId);
  const senderID = String(msg.from.id);
  const chatType = msg.chat.type;

  const cleanArg = args[0]?.toLowerCase();

  // Determine if the sender is a bot admin
  const isBotAdmin = admin.includes(senderID);
  let isGroupAdmin = false;

  // If the chat is a group or supergroup, check if the sender is a group admin
  if (["group", "supergroup"].includes(chatType)) {
    try {
      const member = await bot.getChatMember(chatId, senderID);
      isGroupAdmin = member.status === "administrator" || member.status === "creator";
    } catch (err) {
      isGroupAdmin = false; // Default to not an admin if error occurs
    }
  }

  // Display command-specific help if the argument matches a command name
  if (cleanArg && commands.has(cleanArg)) {
    const cmdInfo = commands.get(cleanArg).setup;
    const helpMessage = generateCommandInfo(cmdInfo, prefix);
    return bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
  }

  // Handle pagination or "all" argument
  const pageNumber = Math.max(1, parseInt(cleanArg) || 1);
  const { helpMessage, replyMarkup } = generateHelpMessage(
    commands,
    senderID,
    isBotAdmin,
    isGroupAdmin,
    pageNumber,
    cleanArg,
    prefix,
    symbols,
    vipUsers,
    chatType
  );

  const helpMsg = await bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown", reply_markup: replyMarkup });

  bot.on('callback_query', async (query) => {
    if (query.message.message_id !== helpMsg.message_id) return;

    const callbackData = query.data;
    const pageMatch = callbackData.match(/^help:(\d+)$/);

    if (pageMatch) {
      const newPageNumber = parseInt(pageMatch[1]);
      const { helpMessage: newHelpMessage, replyMarkup: newReplyMarkup } = generateHelpMessage(
        commands,
        senderID,
        isBotAdmin,
        isGroupAdmin,
        newPageNumber,
        cleanArg,
        prefix,
        symbols,
        vipUsers,
        chatType
      );

      await bot.editMessageText(newHelpMessage, {
        chat_id: chatId,
        message_id: helpMsg.message_id,
        parse_mode: "Markdown",
        reply_markup: newReplyMarkup,
      });
    }

    await bot.answerCallbackQuery(query.id);
  });
};

function generateHelpMessage(
  commands,
  senderID,
  isBotAdmin,
  isGroupAdmin,
  pageNumber,
  cleanArg,
  prefix,
  symbols,
  vipUsers,
  chatType
) {
  const filteredCommands = getFilteredCommands(
    commands,
    senderID,
    isBotAdmin,
    isGroupAdmin,
    vipUsers,
    chatType
  );
  const totalCommands = filteredCommands.length;
  const totalPages = Math.ceil(totalCommands / COMMANDS_PER_PAGE);

  if (cleanArg === "all" || cleanArg === "-all" || cleanArg === "-a") {
    return {
      helpMessage: generateAllCommandsMessage(filteredCommands, prefix, symbols),
      replyMarkup: {},
    };
  }

  if (pageNumber > totalPages) {
    return {
      helpMessage: `Invalid page number. Please use a number between 1 and ${totalPages}.`,
      replyMarkup: {},
    };
  }

  const start = (pageNumber - 1) * COMMANDS_PER_PAGE;
  const paginatedCommands = filteredCommands
    .slice(start, start + COMMANDS_PER_PAGE)
    .map((cmd) => `${symbols} ${prefix}${cmd.setup.name}`);

  const helpMessage = `📜 *Command List*\n\n${paginatedCommands.join("\n")}\n\n*Page:* ${pageNumber}/${totalPages}\n*Total Commands:* ${totalCommands}`;

  const replyMarkup = {
    inline_keyboard: [
      [
        pageNumber > 1 ? { text: '◀️', callback_data: `help:${pageNumber - 1}` } : null,
        pageNumber < totalPages ? { text: '▶️', callback_data: `help:${pageNumber + 1}` } : null,
      ].filter(Boolean), // Removes null values (for invisible buttons)
    ],
  };

  return { helpMessage, replyMarkup };
}

function getFilteredCommands(
  commands,
  senderID,
  isBotAdmin,
  isGroupAdmin,
  vipUsers,
  chatType
) {
  return [...commands.values()]
    .filter((cmd) => {
      let isCommandAvailable = true;

      if (!isBotAdmin) {
        // Filter by access type
        if (cmd.setup.type === "admin" && !isBotAdmin) {
          isCommandAvailable = false;
        }
        if (cmd.setup.type === "vip" && !vipUsers) {
          isCommandAvailable = false;
        }
        if (cmd.setup.type === "administrator" && !isGroupAdmin) {
          isCommandAvailable = false;
        }
        if (cmd.setup.type === "group" && !["group", "supergroup"].includes(chatType)) {
          isCommandAvailable = false;
        }
        if (cmd.setup.type === "private" && chatType !== "private") {
          isCommandAvailable = false;
        }
      }

      return isCommandAvailable;
    })
    .sort((a, b) => a.setup.name.localeCompare(b.setup.name));
}

function generateAllCommandsMessage(filteredCommands, prefix, symbols) {
  const categories = filteredCommands.reduce((acc, cmd) => {
    const category = cmd.setup.category || "misc";
    acc[category] = acc[category] || [];
    acc[category].push(`${symbols} ${prefix}${cmd.setup.name}`);
    return acc;
  }, {});

  const formattedCategories = Object.keys(categories)
    .map(
      (category) => `📂 *${capitalize(category)}*\n${categories[category].join("\n")}\n`
    )
    .join("\n");

  return `${formattedCategories}\n*Total Commands:* ${filteredCommands.length}`;
}

function generateCommandInfo(cmdInfo, prefix) {
  const aliases = cmdInfo.aliases?.length
    ? `*Aliases:*\n${cmdInfo.aliases.map((alias) => `\`${alias}\``).join(", ")}`
    : "*Aliases:*\nNone";

  const usageList = Array.isArray(cmdInfo.guide)
    ? cmdInfo.guide.map((u) => `\`${prefix}${cmdInfo.name} ${u}\``).join("\n")
    : `\`${prefix}${cmdInfo.name} ${cmdInfo.guide}\``;

  return `📘 *Command:* \`${cmdInfo.name}\`\n\n*Description:*\n${cmdInfo.description}\n\n*Usage:*\n${usageList}\n\n*Category:*\n${capitalize(
    cmdInfo.category
  )}\n\n*Cooldown:*\n${cmdInfo.cooldown || 0} seconds\n\n${aliases}`;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
