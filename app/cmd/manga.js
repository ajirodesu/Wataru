import axios from 'axios';

export const setup = {
  name: "manga",
  aliases: [],
  version: "0.0.1",
  author: "Ryzendesu",
  description: "Get manga information from a query.",
  guide: ["<manga_name>"],
  cooldown: 0,
  type: "anyone",
  category: "anime"
};

export const onStart = async function({ message, bot, chatId, args, log, usages }) {
  try {
    // Check if the user provided a manga name
    if (args.length === 0) {
      await usages();
      return;
    }

    // Join args into the manga query
    const query = args.join(" ");

    // Fetch manga information from the API
    const response = await axios.get(`${global.api.ryzen}/api/weebs/manga-info?query=${encodeURIComponent(query)}`);
    const manga = response.data;

    // Construct the message with manga details
    const messageText = `
*Title*: ${manga.title}
*Chapters*: ${manga.chapters}
*Volumes*: ${manga.volumes}
*Type*: ${manga.type}
*Status*: ${manga.status}
*Genre*: ${manga.genre}
*Score*: ${manga.score} (Scored by ${manga.scored_by} users)
*Rank*: ${manga.rank}
*Popularity*: ${manga.popularity}
*Favorites*: ${manga.favorites}
*Members*: ${manga.members}
  
*Synopsis*: ${manga.synopsis}

[More info](${manga.url})
    `;

    // Send the manga details to the chat
    await bot.sendMessage(chatId, messageText, { parse_mode: "Markdown" });

  } catch (error) {
    log.error("Error fetching manga info: " + error);
    // Send error message to the chat if the API request fails
    await bot.sendMessage(chatId, `An error occurred while fetching manga information: ${error.message}`);
  }
};
