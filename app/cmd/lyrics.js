export const setup = {
  name: "lyrics",
  aliases: [],
  version: "0.0.1",
  author: "Lance Cochangco",
  description: "Fetch complete song lyrics.",
  guide: ["<song name>"],
  cooldown: 0,
  type: "anyone",
  category: "music"
};

export const onStart = async function({ message, bot, chatId, args, log, usages }) {
  try {
    // Check if the user provided a song name
    if (!args || args.length === 0) {
      return await usages();
    }

    const query = encodeURIComponent(args.join(" "));
    const apiUrl = `${global.api.ajiro}/api/lyrics?query=${query}`;

    // Fetch data from the lyrics API
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Check if the API returned a valid result
    if (!data || !data.result || !data.result.lyrics) {
      throw new Error("Lyrics not found for the given song.");
    }

    const { title, artist, lyrics, url } = data.result;

    // Create a message with song title, artist, and the complete lyrics
    const messageText = `
🎶 *${title}* by *${artist}*
🔗 [View on Genius](${url})

*Lyrics:*\n
${lyrics}`;

    // Send the complete lyrics as a text message to the chat
    await bot.sendMessage(chatId, messageText, { parse_mode: "Markdown" });

  } catch (error) {
    log.error("Error executing command:", error);
    await bot.sendMessage(chatId, `An error occurred: ${error.message}`);
  }
};
