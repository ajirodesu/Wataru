export const setup = {
  name: "help",
  aliases: ["h"],
  version: "0.0.1",
  author: "AjiroDesu",
  description: "Displays help information for commands.",
  guide: "<command|page|all>",
  cooldown: 5,
  prefix: false,
  type: "anyone",
  category: "system",
};

const COMMANDS_PER_PAGE = 10;

export const onStart = async function({ bot, chatId, userId, args }) {
  const { commands } = global.client;
  const { admin, prefix, symbols } = global.config;
  const cleanArg = args[0]?.toLowerCase();

  // Display command-specific help if the argument matches a command name
  if (cleanArg && commands.has(cleanArg)) {
    const cmdInfo = commands.get(cleanArg).setup;
    const helpMessage = generateCommandInfo(cmdInfo, prefix);
    return bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
  }

  // Handle pagination or "all" argument
  const pageNumber = Math.max(1, parseInt(cleanArg) || 1);
  const { helpMessage } = generateHelpMessage(
    commands,
    userId,
    admin,
    pageNumber,
    cleanArg,
    prefix,
    symbols
  );

  await bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
};

function generateHelpMessage(commands, userId, admin, pageNumber, cleanArg, prefix, symbols) {
  const filteredCommands = getFilteredCommands(commands, userId, admin);
  const totalCommands = filteredCommands.length;
  const totalPages = Math.ceil(totalCommands / COMMANDS_PER_PAGE);

  if (cleanArg === "all" || cleanArg === "-all" || cleanArg === "-a") {
    return {
      helpMessage: generateAllCommandsMessage(filteredCommands, prefix, symbols),
    };
  }

  if (pageNumber > totalPages) {
    return {
      helpMessage: `Invalid page number. Please use a number between 1 and ${totalPages}.`,
    };
  }

  const start = (pageNumber - 1) * COMMANDS_PER_PAGE;
  const paginatedCommands = filteredCommands
    .slice(start, start + COMMANDS_PER_PAGE)
    .map((cmd) => `${symbols} ${prefix}${cmd.setup.name}`);

  return {
    helpMessage: `📜 *Command List*\n\n${paginatedCommands.join("\n")}\n\n*Page:* ${pageNumber}/${totalPages}\n*Total Commands:* ${totalCommands}`,
  };
}

function getFilteredCommands(commands, userId, admin) {
  const isAdmin = admin.includes(userId.toString());

  return [...commands.values()]
    .filter((cmd) => {
      const accessLevel = cmd.setup.type || "anyone";
      const category = cmd.setup.category || "misc";
      if (isAdmin) {
        return true; // Admins see all commands
      }
      if (accessLevel === "administrator") {
        return false; // Exclude commands for admins or owners
      }
      return true;
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
