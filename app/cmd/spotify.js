const axios = require('axios');
const fs = require('fs');
const path = require('path');

exports.meta = {
  name: "spotify",
  aliases: ["sp"],
  version: "1.0.0",
  author: "Jr Busaco",
  description: "Search and download songs from Spotify",
  guide: [""],
  cooldown: 5,
  type: "anyone",
  category: "music"
};

exports.onStart = async function({ bot, chatId, msg, args }) {
  const query = args.join(" ");
  if (!query) {
    return await bot.sendMessage(chatId, "Please provide a search query!");
  }

  try {
    const searchResponse = await axios.get(`https://spotidl.gleeze.com/search?query=${encodeURIComponent(query)}`);

    if (!searchResponse.data.status || !searchResponse.data.results.length) {
      return await bot.sendMessage(chatId, "No songs found!");
    }

    // Limit to the first 10 results
    const results = searchResponse.data.results.slice(0, 10);

    // Build the message text with details for each track
    let responseMsg = "🎵 *Search Results:*\n\n";
    results.forEach((track, index) => {
      responseMsg += `*${index + 1}.* ${track.title}\n`;
      responseMsg += `👤 ${track.artist}\n`;
      responseMsg += `⏱️ ${Math.floor(track.duration / 1000 / 60)}:${String(Math.floor((track.duration / 1000) % 60)).padStart(2, '0')}\n\n`;
    });
    responseMsg += "Select your song by clicking the corresponding button below:";

    // Build an inline keyboard – one button per track
    const inlineKeyboard = results.map((track, index) => ([
      { text: `${index + 1}`, callback_data: String(index) }
    ]));

    const sentMsg = await bot.sendMessage(chatId, responseMsg, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    });

    // Set up a callback query handler for this message.
    // Using a closure here so we can remove the listener after handling the response.
    const callbackQueryHandler = async (query) => {
      // Ensure the callback is for our sent message
      if (!query.message || query.message.message_id !== sentMsg.message_id) return;

      // Remove the listener so it runs only once per command instance
      bot.removeListener('callback_query', callbackQueryHandler);

      // Only allow the user who initiated the command to use the buttons
      if (query.from.id !== msg.from.id) {
        await bot.answerCallbackQuery(query.id, { text: "You are not the person who initiated this command.", show_alert: true });
        return;
      }

      // Parse the chosen index (the button returns a 0-indexed number)
      const choice = parseInt(query.data);
      if (isNaN(choice) || choice < 0 || choice >= results.length) {
        await bot.answerCallbackQuery(query.id, { text: "Invalid choice!", show_alert: true });
        return;
      }

      // Acknowledge the callback query (so the button spinner stops)
      await bot.answerCallbackQuery(query.id);

      const selectedTrack = results[choice];

      try {
        // Let the user know the download is in progress
        const downloadingMsg = await bot.sendMessage(chatId, "⏳ Downloading your song...");

        // Remove the message with the inline keyboard
        await bot.deleteMessage(chatId, sentMsg.message_id);

        // Call the download endpoint using the selected track’s URL
        const dlResponse = await axios.get(`https://spotidl.gleeze.com/spotifydl?url=${selectedTrack.url}`);

        if (!dlResponse.data.status) {
          await bot.deleteMessage(chatId, downloadingMsg.message_id);
          return await bot.sendMessage(chatId, "Failed to download the song!");
        }

        const songData = dlResponse.data.song;
        const mp3Response = await axios.get(songData.mp3, { responseType: 'arraybuffer' });

        // Ensure the temporary directory exists
        const tempDir = path.join(process.cwd(), 'app/tmp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Save the MP3 file temporarily
        const mp3Path = path.join(tempDir, `${selectedTrack.id}.mp3`);
        fs.writeFileSync(mp3Path, Buffer.from(mp3Response.data));

        // Send the audio file to the chat with a caption
        await bot.sendAudio(chatId, mp3Path, {
          caption: `🎵 ${selectedTrack.title}\n👤 ${selectedTrack.artist}`
        });

        // Clean up: delete the downloading message and the temporary file
        await bot.deleteMessage(chatId, downloadingMsg.message_id);
        if (fs.existsSync(mp3Path)) {
          fs.unlinkSync(mp3Path);
        }
      } catch (error) {
        console.error(error);
        await bot.sendMessage(chatId, "An error occurred while downloading the song!");
      }
    };

    // Listen for callback queries – this listener will be removed after handling one callback.
    bot.on('callback_query', callbackQueryHandler);

  } catch (error) {
    console.error(error);
    await bot.sendMessage(chatId, "An error occurred while searching for songs!");
  }
};