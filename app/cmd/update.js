"use strict";

const path = require("path");
const updater = require(path.join(process.cwd(), "system", "update"));

exports.meta = {
  name: "update",
  aliases: [],
  prefix: "both",
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Updates the bot to the latest version from GitHub.",
  guide: [],
  cooldown: 10,
  type: "admin", // Restrict to admin users if desired
  category: "system"
};

/**
 * Handles the /update command in Telegram.
 * @param {Object} params - Wataru bot framework parameters.
 */
exports.onStart = async function({ wataru, chatId, msg }) {

  try {
    await wataru.reply("Starting update process...");
    updater.updateBot();
    await wataru.reply("Update completed successfully!");
    await wataru.reply("Restarting bot now...");
    process.exit(0); // Trigger restart via index.js
  } catch (error) {
    await wataru.reply(`Failed to update the bot: ${error.message}`);
  }
};

// Shell entry point for `node update`
if (require.main === module) {
  console.log("Running update from shell...");
  updater.updateBot().catch((error) => {
    console.error("Shell update failed:", error.message);
    process.exit(1); // Exit with error code if shell-initiated
  });
}