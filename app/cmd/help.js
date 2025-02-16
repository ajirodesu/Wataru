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

exports.onStart = async function ({ bot, chatId, userId, args, msg }) {
  const { commands } = global.client;
  const { admin, prefix, symbols } = global.config;
  const vipUsers = global.vip.uid.includes(userId);
  const senderID = String(msg.from.id);
  const chatType = msg.chat.type;

  const cleanArg = args[0]?.toLowerCase();

  // Determine if the sender is a bot admin
  const isBotAdmin = admin.includes(senderID);
  const isGroupAdmin = await checkGroupAdmin(bot, chatId, senderID, chatType);

  // If argument matches a command, show that command’s help info.
  if (cleanArg && commands.has(cleanArg)) {
    const cmdInfo = commands.get(cleanArg).setup;
    const helpMessage = generateCommandInfo(cmdInfo, prefix);
    return bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
  }

  // Otherwise, handle paginated help (or the “all” listing)
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

  // Send the help message with the inline keyboard (buttons carry JSON data with helpMessageId set to null)
  const helpMsg = await bot.sendMessage(chatId, helpMessage, {
    parse_mode: "Markdown",
    reply_markup: replyMarkup,
  });

  // Update the inline keyboard so that each button’s callback_data now includes the actual message_id
  const newReplyMarkup = updateReplyMarkupWithMessageId(replyMarkup, helpMsg.message_id);
  await bot.editMessageReplyMarkup(newReplyMarkup, { chat_id: chatId, message_id: helpMsg.message_id });
};

exports.onCallback = async function ({ bot, callbackQuery, chatId, args }) {
  let payload;
  try {
    payload = JSON.parse(callbackQuery.data);
  } catch (e) {
    // If parsing fails, do nothing.
    return;
  }

  // Verify this callback is for the help command and for the correct message.
  if (payload.command !== "help") return;
  if (!payload.helpMessageId || callbackQuery.message.message_id !== payload.helpMessageId) return;

  const newPageNumber = payload.page;
  const { commands } = global.client;
  const { admin, prefix, symbols } = global.config;
  const senderID = String(callbackQuery.from.id);
  const vipUsers = global.vip.uid.includes(senderID);
  const chat_id = callbackQuery.message.chat.id;
  const chatType = callbackQuery.message.chat.type;

  const isBotAdmin = admin.includes(senderID);
  const isGroupAdmin = await checkGroupAdmin(bot, chat_id, senderID, chatType);

  // Generate the new help message for the requested page.
  const { helpMessage, replyMarkup } = generateHelpMessage(
    commands,
    senderID,
    isBotAdmin,
    isGroupAdmin,
    newPageNumber,
    null, // cleanArg is not used during callbacks
    prefix,
    symbols,
    vipUsers,
    chatType
  );

  // Update the inline keyboard with the correct message_id.
  const newReplyMarkup = updateReplyMarkupWithMessageId(replyMarkup, callbackQuery.message.message_id);
  await bot.editMessageText(helpMessage, {
    chat_id: chat_id,
    message_id: callbackQuery.message.message_id,
    parse_mode: "Markdown",
    reply_markup: newReplyMarkup,
  });

  await bot.answerCallbackQuery(callbackQuery.id);
};

/* Helper Functions */

/**
 * Updates each button in the inline keyboard so that its JSON‑encoded callback data includes the provided messageId.
 */
function updateReplyMarkupWithMessageId(replyMarkup, messageId) {
  if (!replyMarkup || !replyMarkup.inline_keyboard) return replyMarkup;
  const updatedKeyboard = replyMarkup.inline_keyboard.map(row =>
    row.map(button => {
      if (button && button.callback_data) {
        try {
          let data = JSON.parse(button.callback_data);
          data.helpMessageId = messageId;
          return { text: button.text, callback_data: JSON.stringify(data) };
        } catch (e) {
          return button;
        }
      }
      return button;
    })
  );
  return { inline_keyboard: updatedKeyboard };
}

/**
 * Checks if the sender is an administrator in a group or supergroup.
 */
async function checkGroupAdmin(bot, chatId, senderID, chatType) {
  if (["group", "supergroup"].includes(chatType)) {
    try {
      const member = await bot.getChatMember(chatId, senderID);
      return member.status === "administrator" || member.status === "creator";
    } catch (err) {
      return false;
    }
  }
  return false;
}

/**
 * Generates the help message text and the inline keyboard (with paginated navigation).
 */
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
  const filteredCommands = getFilteredCommands(commands, senderID, isBotAdmin, isGroupAdmin, vipUsers, chatType);
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
    .map(cmd => `${symbols} ${prefix}${cmd.setup.name}`);

  const helpMessage = `📜 *Command List*\n\n${paginatedCommands.join("\n")}\n\n*Page:* ${pageNumber}/${totalPages}\n*Total Commands:* ${totalCommands}`;

  // Build the inline keyboard with JSON-encoded callback data.
  const replyMarkup = {
    inline_keyboard: [
      [
        pageNumber > 1
          ? { text: "◀️", callback_data: JSON.stringify({ command: "help", helpMessageId: null, page: pageNumber - 1 }) }
          : null,
        pageNumber < totalPages
          ? { text: "▶️", callback_data: JSON.stringify({ command: "help", helpMessageId: null, page: pageNumber + 1 }) }
          : null,
      ].filter(Boolean),
    ],
  };

  return { helpMessage, replyMarkup };
}

/**
 * Filters commands based on the sender’s permissions and the command’s type.
 */
function getFilteredCommands(commands, senderID, isBotAdmin, isGroupAdmin, vipUsers, chatType) {
  return [...commands.values()]
    .filter(cmd => {
      // Always hide commands with the "hidden" category.
      if (cmd.setup.category && cmd.setup.category.toLowerCase() === "hidden") {
        return false;
      }

      let isCommandAvailable = true;
      if (!isBotAdmin) {
        if (cmd.setup.type === "admin") {
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

/**
 * Generates a formatted message grouping all commands by category.
 */
function generateAllCommandsMessage(filteredCommands, prefix, symbols) {
  const categories = filteredCommands.reduce((acc, cmd) => {
    const category = cmd.setup.category || "misc";
    if (!acc[category]) acc[category] = [];
    acc[category].push(`${symbols} ${prefix}${cmd.setup.name}`);
    return acc;
  }, {});

  const formattedCategories = Object.keys(categories)
    .map(category => `📂 *${capitalize(category)}*\n${categories[category].join("\n")}\n`)
    .join("\n");

  return `${formattedCategories}\n*Total Commands:* ${filteredCommands.length}`;
}

/**
 * Generates a detailed help message for a single command.
 */
function generateCommandInfo(cmdInfo, prefix) {
  const aliases = cmdInfo.aliases?.length
    ? `*Aliases:*\n${cmdInfo.aliases.map(alias => `\`${alias}\``).join(", ")}`
    : "*Aliases:*\nNone";

  const usageList = Array.isArray(cmdInfo.guide)
    ? cmdInfo.guide.map(u => `\`${prefix}${cmdInfo.name} ${u}\``).join("\n")
    : `\`${prefix}${cmdInfo.name} ${cmdInfo.guide}\``;

  return `📘 *Command:* \`${cmdInfo.name}\`\n\n*Description:*\n${cmdInfo.description}\n\n*Usage:*\n${usageList}\n\n*Category:*\n${capitalize(cmdInfo.category)}\n\n*Cooldown:*\n${cmdInfo.cooldown || 0} seconds\n\n${aliases}`;
}

/**
 * Capitalizes the first letter of the given text.
 */
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
