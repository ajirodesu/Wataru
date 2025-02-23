const fs = require("fs-extra");
const path = require("path");

exports.meta = {
  name: "restart",
  aliases: [],
  prefix: "command", // Adjust if needed
  version: "1.1",
  author: "NTKhang",
  cooldown: 5,
  type: "admin",
  description: "Restart bot",
  category: "Owner",
  guide: ["Restart bot"]
};

exports.onStart = async function({ wataru, chatId, msg, args }) {
  // Ensure the assets directory exists.
  const assetsDir = path.join(__dirname, "assets");
  fs.ensureDirSync(assetsDir);

  const pathFile = path.join(assetsDir, "restart.txt");

  // If the restart file exists and contains valid data,
  // assume the bot has restarted successfully and report the elapsed time.
  if (fs.existsSync(pathFile)) {
    const data = fs.readFileSync(pathFile, "utf-8").trim();
    if (data.length > 0) {
      const [tid, timeValue] = data.split(" ");
      const diff = ((Date.now() - Number(timeValue)) / 1000).toFixed(2);
      await wataru.reply(`✅ | Bot restarted\n⏰ | Time: ${diff}s`);
      fs.unlinkSync(pathFile);
      return; // Do not proceed with a new restart.
    }
  }

  // Write the current chatId and timestamp to the restart file.
  fs.writeFileSync(pathFile, `${chatId} ${Date.now()}`);

  // Send the "Restarting bot" message (only during restarting).
  await wataru.reply("🔄 | Restarting bot...");

  // Exit the process to allow an external process manager to restart the bot.
  process.exit(2);
};
