const moment = require("moment-timezone");

exports.event = async function ({ bot, msg }) {
  const timeStart = Date.now();
  const time = moment.tz("Asia/Manila").format("HH:mm:ss L");

  const { events } = global.client;
  const { devMode } = global.config;

  const chatId = String(msg.chat.id);
  const chatType = msg.chat.type;

  // Check if the message is a system event (join/leave)
  if (msg.new_chat_members || msg.left_chat_member) {
    for (const [eventName, eventHandler] of events.entries()) {
      // For join events, check for "welcome"; for leave events, check for "leave"
      if (eventHandler.setup.type.includes(msg.new_chat_members ? "welcome" : "leave")) {
        try {
          const context = { bot, msg, chatId };

          await eventHandler.onStart(context); // Execute the event

          if (devMode) {
            console.log(
              `[ Event ] Executed "${eventHandler.setup.name}" at ${time} in ${Date.now() - timeStart}ms`
            );
          }
        } catch (error) {
          console.error(`[ Event Error ] ${eventHandler.setup.name}:`, error);
        }
      }
    }
    // Exit after processing system events
    return;
  }
};
