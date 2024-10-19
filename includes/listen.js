import command from './handler/command.js';
import reply from './handler/reply.js';
import event from './handler/event.js';
import { Database } from './handler/database.js';

const db = new Database();
global.db = db;

export const listen = async ({ bot, log }) => {
  await db.load(); // Load the database when starting

  bot.on('message', async (msg) => {
    const { chat: { id: chatId, type: chatType }, from: { id: userId, first_name: userName } } = msg;

    // Create the object that will be passed to commands, replies, and events
    const object = {
      bot,
      msg,
      chatId,
      userId,
      userName,
      log,
      db
    };

    // Check if the message is from a group or supergroup
    if (chatType === 'group' || chatType === 'supergroup') {
      const group = db.getGroup(chatId);  // Get or create the group by its ID

      // Update last activity for the group
      await db.updateGroup(chatId, (group) => {
        group.lastActivity = new Date().toISOString();
      });

      // Handle 'onlyadmin' mode
      if (group.onlyadmin) {
        const chatMember = await bot.getChatMember(chatId, userId);
        if (!['creator', 'administrator'].includes(chatMember.status)) {
          return; // Ignore if the user is not an admin and 'onlyadmin' mode is enabled
        }
      }

      // Execute command, reply, and event handlers for groups
      command(object);
      reply(object);
      event(object);

    } else if (chatType === 'private') {
      // In private chats, don't record anything in the group database, just handle user interactions
      command(object);
      reply(object);
      event(object);
    }
  });

  // Periodically clean up inactive groups
  setInterval(async () => {
    const allGroupIds = db.getAllGroupIds();
    const now = new Date();
    for (const groupId of allGroupIds) {
      const group = db.getGroup(groupId);
      if (group.lastActivity) {
        const lastActivity = new Date(group.lastActivity);
        // Remove groups inactive for more than 30 days
        if ((now - lastActivity) > 30 * 24 * 60 * 60 * 1000) {
          await db.deleteGroup(groupId);
          log.system(`Removed inactive group: ${groupId}`);
        }
      }
    }
  }, 24 * 60 * 60 * 1000); // Run once a day

  // Periodically save the database
  setInterval(() => {
    db.save();
  }, 5 * 60 * 1000); // Save every 5 minutes
};
