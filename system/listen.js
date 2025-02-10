const { command } = require('./handle/command');
const { commandEvent } = require('./handle/commandEvent');
const { reply } = require('./handle/reply');
const { event } = require('./handle/event');

exports.listen = async function ({ bot, msg, chatId }) {
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
};