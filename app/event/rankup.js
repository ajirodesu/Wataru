export const setup = {
  name: 'rankup',
  version: '0.0.1',
  description: 'Handles user ranking up when they gain enough points.',
  author: 'Ajirodesu'
};

export const onEvent = async ({ bot, chatId, userId, msg, log, db }) => {
  try {
    const userName = msg.from.first_name + (msg.from.last_name ? ' ' + msg.from.last_name : '');
    const newLevel = await db.rankUp(userId, userName);
    if (newLevel) {
      await bot.sendMessage(chatId, `Congratulations ${newLevel.name}! You've reached level ${newLevel.level}!`);
    }
  } catch (error) {
    log.error(`Error handling rank up event for user ${userId}:\n` + error.message);
  }
};
