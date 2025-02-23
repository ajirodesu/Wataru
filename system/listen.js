const fs = require('fs');
const path = require('path');
const { createWataru } = require("./utility/wataru");

exports.listen = async function ({ bot, msg }) {
  try {
    const wataru = createWataru(bot, msg);
    const handlersPath = path.join(__dirname, 'handle');

    const files = fs.readdirSync(handlersPath);
    for (const file of files) {
      if (file.endsWith('.js')) {
        const handlerModule = require(path.join(handlersPath, file));
        // Use the filename (without extension) as the key to the exported function.
        const handlerName = path.basename(file, '.js');
        const handler = handlerModule[handlerName];

        if (typeof handler === 'function') {
          await handler({ bot, msg, chatId: msg.chat.id, wataru });
        } else {
          console.warn(`Handler ${file} does not export a function named "${handlerName}".`);
        }
      }
    }
  } catch (error) {
    console.error('Error reading handlers directory:', error);
  }
};
