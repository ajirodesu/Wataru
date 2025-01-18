import util from 'util';

export const setup = {
  name: 'eval',
  version: '0.0.1',
  author: 'Shinpei',
  type: 'admin',
  description: 'Execute JavaScript code (owner only)',
  category: 'owner',
  guide: '<code>',
  cooldown: 0,
};

export const onStart = async function({ bot, chatId, userId, args, log, usages }) {
  const code = args.join(' '); // Join arguments to form the code to execute
  if (!code) {
    return usages();
  }

  try {
    let result = await eval(code); // Execute the provided JavaScript code
    if (typeof result !== 'string') {
      result = util.inspect(result); // Convert non-string results to a string for display
    }
    await bot.sendMessage(global.config.admin[0], `Result: ${result}`); // Send the result to the admin
  } catch (error) {
    log.error("Error executing command:", error);
    await bot.sendMessage(chatId, `Error: ${error.message}`); // Notify the user of the error
  }
};
