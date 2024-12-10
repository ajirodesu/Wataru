import os from 'os';
import process from 'process';
import axios from 'axios';

export const config = {
  name: "stats",
  author: "Lance Ajiro",
  description: "Display bot statistics",
  access: "anyone",
  category: "system",
  usage: ""
};

export const onCommand = async function({ bot, chatId, log, db }) {
  try {
    const uptime = process.uptime();
    const uptimeString = formatUptime(uptime);

    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = (memoryUsage.rss / (1024 * 1024)).toFixed(2);

    const cpuUsage = os.loadavg();
    const cpuUsageString = cpuUsage.map(avg => avg.toFixed(2)).join(', ');

    const totalCommands = global.client.commands.size;
    const totalEvents = global.client.events.size;
    const totalUsers = db.getAllUserIds().length;
    const totalGroups = db.getAllGroupIds().length;
    const info = await bot.getMe();

    const statsMessage = `
Bot Statistics

${global.config.symbols} Runtime: ${uptimeString}
${global.config.symbols} Memory usage: ${memoryUsageMB} MB           
${global.config.symbols} Total commands: ${totalCommands}
${global.config.symbols} Total events: ${totalEvents}
${global.config.symbols} Total users: ${totalUsers}
${global.config.symbols} Total groups: ${totalGroups}`;

    const gh = "lanceajiro";
    const insta = "lance.cochangco";
    const fb = "Lance Cochangco";
    const bname = info.first_name;
    const hours = Math.floor((uptime % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    let photoData; // Variable to hold photo data
    try {
      const res = await axios.get(
        `${global.api.ajiro}/api/uptime?instag=${insta}&ghub=${gh}&fb=${fb}&hours=${hours}&minutes=${minutes}&seconds=${seconds}&botname=${bname}`,
        { responseType: "stream" }
      );
      photoData = res.data; // Assign photo data if successful
    } catch (error) {
      log.error('[ERROR] Failed to fetch photo:', error);
      // If the API is down, photoData remains undefined
    }

    if (photoData) {
      await bot.sendPhoto(chatId, photoData, {
        caption: statsMessage.trim(),
      });
    } else {
      await bot.sendMessage(chatId, statsMessage.trim());
    }
  } catch (error) {
    log.error('[ERROR]', error);
    await bot.sendMessage(chatId, 'An error occurred while fetching the stats.');
  }
};

function formatUptime(uptime) {
  const days = Math.floor(uptime / (3600 * 24));
  const hours = Math.floor((uptime % (3600 * 24)) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
