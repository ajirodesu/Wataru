import axios from 'axios';

export const config = {
  name: "mal",
  aliases: [],
  author: "Lance Cochangco",
  description: "Get information about an anime from MyAnimeList.",
  usage: ["<anime title>"],
  cooldown: 0,
  access: "anyone",
  category: "utility"
};

export const onCommand = async function({ message, bot, log, args }) {
  try {
    const chatId = message.chat.id;

    // Get the anime title from the command arguments
    const title = args.join(" ") || "summertime render"; // Default title
    const apiUrl = `${global.api.ajiro}/api/mal?title=${encodeURIComponent(title)}`;

    // Fetch anime information from the API
    const response = await axios.get(apiUrl);
    const animeData = response.data;

    // Check if the response contains valid data
    if (!animeData || !animeData.title) {
      await bot.sendMessage(chatId, "Sorry, I couldn't find any information about that anime.");
      return;
    }

    // Prepare the message to send
    const messageText = `*Title:* ${animeData.title}\n` +
                        `*Japanese Title:* ${animeData.japanese}\n` +
                        `*Type:* ${animeData.type}\n` +
                        `*Status:* ${animeData.status}\n` +
                        `*Premiered:* ${animeData.premiered}\n` +
                        `*Broadcast:* ${animeData.broadcast}\n` +
                        `*Aired:* ${animeData.aired}\n` +
                        `*Producers:* ${animeData.producers}\n` +
                        `*Studios:* ${animeData.studios}\n` +
                        `*Episodes:* ${animeData.episodes}\n` +
                        `*Duration:* ${animeData.duration}\n` +
                        `*Genres:* ${animeData.genres}\n` +
                        `*Popularity:* ${animeData.popularity}\n` +
                        `*Ranked:* ${animeData.ranked}\n` +
                        `*Score:* ${animeData.score}\n` +
                        `*Rating:* ${animeData.rating}\n` +
                        `*Description:* ${animeData.description}\n\n` +
                        `*Members:* ${animeData.members}\n` +
                        `*Favorites:* ${animeData.favorites}\n` +
                        `*More Info:* [Click here](${animeData.url})`;

    // Send the result back to the chat with Markdown formatting
    await bot.sendMessage(chatId, messageText, { parse_mode: "Markdown" });
    
  } catch (error) {
    log.error("Error fetching anime information:", error);
    await bot.sendMessage(chatId, `An error occurred while fetching the anime information: ${error.message}`);
  }
};
