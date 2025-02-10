exports.setup = {
  name: 'rps',
  version: '1.0.0',
  description: 'Play Rock Paper Scissors',
  author: 'JohnDev19',
  type: 'anyone',
  cooldown: 5,
  category: 'fun',
  guide: [
    ''
  ]
};

exports.onStart = async function({ bot, msg }) {
  const chatId = msg.chat.id;
  const choices = ['rock', 'paper', 'scissors'];
  const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };

  const gameMessage = await bot.sendMessage(chatId, 'Choose Rock, Paper, or Scissors:', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Rock 🪨', callback_data: 'rock' },
          { text: 'Paper 📄', callback_data: 'paper' },
          { text: 'Scissors ✂️', callback_data: 'scissors' },
        ],
      ],
    },
  });

  bot.on('callback_query', async (query) => {
    if (query.message.message_id !== gameMessage.message_id) return;

    const playerChoice = query.data;
    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    let result;
    if (playerChoice === botChoice) {
      result = "It's a tie!";
    } else if (
      (playerChoice === 'rock' && botChoice === 'scissors') ||
      (playerChoice === 'paper' && botChoice === 'rock') ||
      (playerChoice === 'scissors' && botChoice === 'paper')
    ) {
      result = 'You win!';
    } else {
      result = 'You lose!';
    }

    await bot.editMessageText(`You chose ${emojis[playerChoice]}\nI chose ${emojis[botChoice]}\n\n${result}`, {
      chat_id: chatId,
      message_id: gameMessage.message_id,
      reply_markup: { inline_keyboard: [] },
    });

    await bot.answerCallbackQuery(query.id);
  });
};
