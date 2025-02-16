const moment = require("moment-timezone");

exports.command = async function ({ bot, msg, chatId, args }) {
  const dateNow = Date.now();
  const time = moment.tz(`${global.config.timeZone}`).format("HH:mm:ss DD/MM/YYYY");

  const { prefix, admin, symbols, devMode } = global.config;
  const { commands, cooldowns } = global.client;
  const { text, from, chat } = msg;
  const senderID = String(from.id);
  const userId = from.id;

  // ── Automatic Response for "prefix" Message ─────────────────────────────
  if (text.trim().toLowerCase() === "prefix") {
    return bot.sendMessage(chatId, `${prefix} is my prefix.`);
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Determine if the message starts with the prefix.
  const prefixUsed = text.startsWith(prefix);

  // Remove the prefix if used; otherwise, use the raw trimmed text.
  const commandText = prefixUsed ? text.slice(prefix.length).trim() : text.trim();

  // If no command text is provided, respond (if the user did type the prefix) or ignore.
  if (commandText.length === 0) {
    if (prefixUsed) {
      return bot.sendMessage(chatId, "Please enter a command after the prefix.");
    } else {
      return;
    }
  }

  // Extract the command name and arguments.
  const commandArgs = commandText.split(/\s+/);
  let commandName = commandArgs.shift().toLowerCase();

  // Handle commands that include a bot username (e.g., "/help@YourBotUsername")
  if (commandName.includes("@")) {
    const parts = commandName.split("@");
    commandName = parts[0];
    try {
      const me = await bot.getMe();
      const botUsername = me.username;
      if (parts[1].toLowerCase() !== botUsername.toLowerCase()) {
        return;
      }
    } catch (error) {
      console.error("Failed to get bot username:", error);
      return;
    }
  }

  // Retrieve the command module using its primary name.
  let command = commands.get(commandName);

  // ── Alias Support ──────────────────────────────────────────────────────────
  // If the command wasn't found by its primary name, check its aliases.
  if (!command) {
    for (const cmd of commands.values()) {
      if (
        cmd.setup.aliases &&
        Array.isArray(cmd.setup.aliases) &&
        cmd.setup.aliases.map((alias) => alias.toLowerCase()).includes(commandName)
      ) {
        command = cmd;
        break;
      }
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  if (!command) {
    // Optionally, you can choose whether or not to reply for unknown commands.
    if (prefixUsed) {
      return bot.sendMessage(chatId, `The command "${commandName}" is not found in my system.`);
    } else {
      return;
    }
  }

  // ── Check the Command’s Prefix Requirement ────────────────────────────────
  // Default to true (prefix required) if not defined.
  let cmdPrefixSetting = command.setup.prefix;
  if (cmdPrefixSetting === undefined) {
    cmdPrefixSetting = true;
  }
  // If the command requires a prefix but none was used, send a response.
  if (cmdPrefixSetting === true && !prefixUsed) {
    return bot.sendMessage(
      chatId,
      `The command "${command.setup.name}" requires a prefix. Please use "${prefix}" before the command name.`
    );
  }
  // If the command does not require a prefix but one was used, send a response.
  if (cmdPrefixSetting === false && prefixUsed) {
    return bot.sendMessage(
      chatId,
      `The command "${command.setup.name}" does not require a prefix. Please invoke it without the prefix.`
    );
  }
  // For "both", no check is needed.
  // ─────────────────────────────────────────────────────────────────────────

  // Define the usages helper function.
  const usages = () => {
    if (!command.setup.guide) return;
    let usageText = `${symbols} Usages:\n`;
    const displayPrefix = (command.setup.prefix === false) ? "" : prefix;
    if (Array.isArray(command.setup.guide)) {
      for (const guide of command.setup.guide) {
        usageText += `${displayPrefix}${command.setup.name} ${guide}\n`;
      }
    } else {
      usageText += `${displayPrefix}${command.setup.name} ${command.setup.guide}`;
    }
    return bot.sendMessage(chatId, usageText, { parse_mode: "Markdown" });
  };

  // ── Check Permissions and Restrictions ────────────────────────────────────

  const isBotAdmin = admin.includes(senderID);
  const isVIP = global.vip.uid.includes(senderID);

  if (command.setup.type === "administrator" && !isBotAdmin) {
    if (!["group", "supergroup"].includes(chat.type)) {
      return bot.sendMessage(
        chatId,
        `The "${command.setup.name}" command can only be used in a group or supergroup by an administrator.`
      );
    }
    try {
      const member = await bot.getChatMember(chatId, senderID);
      if (!(member.status === "administrator" || member.status === "creator")) {
        return bot.sendMessage(
          chatId,
          `You do not have sufficient permission to use the "${command.setup.name}" command. (Requires group administrator)`
        );
      }
    } catch (error) {
      return bot.sendMessage(chatId, "Unable to verify your group admin status. Please try again later.");
    }
  }

  if (!isBotAdmin) {
    if (command.setup.type === "admin") {
      return bot.sendMessage(chatId, `You do not have sufficient permission to use the "${command.setup.name}" command.`);
    }
    if (command.setup.type === "vip" && !isVIP) {
      return bot.sendMessage(chatId, `You do not have VIP access to use the "${command.setup.name}" command.`);
    }
    if (command.setup.type === "group" && !["group", "supergroup"].includes(chat.type)) {
      return bot.sendMessage(chatId, `The "${command.setup.name}" command can only be used in a group or supergroup.`);
    }
    if (command.setup.type === "private" && chat.type !== "private") {
      return bot.sendMessage(chatId, `The "${command.setup.name}" command can only be used in private chats.`);
    }
  }

  // ── Cooldown Logic (Bot Admins bypass cooldowns) ───────────────────────────
  if (!isBotAdmin) {
    if (!cooldowns.has(command.setup.name)) {
      cooldowns.set(command.setup.name, new Map());
    }
    const timestamps = cooldowns.get(command.setup.name);
    const expirationTime = (command.setup.cooldown || 1) * 1000;
    if (timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime) {
      const timeLeft = Math.ceil((timestamps.get(senderID) + expirationTime - dateNow) / 1000);
      return bot.sendMessage(chatId, `😼 Please wait ${timeLeft} seconds before using "${commandName}" again.`);
    }
    timestamps.set(senderID, dateNow);
  }

  try {
    // Build the context and execute the command.
    const context = {
      bot,
      msg,
      chatId,
      args: commandArgs,
      type: isBotAdmin ? "admin" : "anyone",
      userId,
      usages,
    };

    await command.onStart(context);

    if (devMode === true) {
      console.log(
        `Executed command "${commandName}" at ${time} from ${senderID} with arguments: ${commandArgs.join(" ")} in ${Date.now() - dateNow}ms`,
        "[ DEV MODE ]"
      );
    }
  } catch (e) {
    console.error(`Error executing command "${commandName}":`, e);
    return bot.sendMessage(chatId, `Error executing command "${commandName}": ${e.message}`);
  }
};