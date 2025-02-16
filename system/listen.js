const { command } = require('./handle/command');
const { commandEvent } = require('./handle/commandEvent');
const { reply } = require('./handle/reply');
const { event } = require('./handle/event');
const { greet } = require('./handle/greet');
const { callback } = require('./handle/callback');

// Ensure the callback query listener is registered only once.
let isCallbackRegistered = false;

exports.listen = async function ({ bot, msg, chatId }) {
  // Register the callback query handler once.
  if (!isCallbackRegistered) {
    callback({ bot });
    isCallbackRegistered = true;
  }

  // If there is no text (e.g. join/leave notifications), process as an event.
  if (!msg.text) {
    return event({ bot, msg, chatId });
  }

  // For text messages, process direct command invocations and replies.
  const args = msg.text.split(' ').slice(1);
  const context = {
    bot,
    msg,
    chatId,
    args
  };

  await command(context);
  await commandEvent(context);
  await reply(context);
  await greet(context);
};
