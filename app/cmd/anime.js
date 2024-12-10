import axios from 'axios';

export const config = {
  name: 'anime',
  aliases: ['animeinfo'],
  author: 'David',
  description: 'Fetches details about anime',
  usage: ['[anime_name]'],
  cooldown: 5,
  access: 'anyone',
  category: 'anime',
};

export const onCommand = async function({ bot, chatId, args, usages, log }) {
  if (!args[0]) {
    return usages();
  }

  try {
    await bot.sendChatAction(chatId, 'upload_document');

    const query = `
      query ($title: String) {
        Media (search: $title, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          description
          coverImage {
            medium
            large
          }
          genres
          format
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          season
          seasonYear
          episodes
          status
          averageScore
          relations {
            edges {
              relationType(version: 2)
              node {
                id
                title {
                  romaji
                  english
                }
              }
            }
          }
        }
      }
    `;

    const variables = {
      title: args.join(' '),
    };

    const response = await axios.post('https://graphql.anilist.co/', { query, variables });
    const animeData = response.data.data.Media;

    if (!animeData) {
      return bot.sendMessage(chatId, `No anime found with the title: ${args.join(' ')}`);
    }

    const { romaji, english, native } = animeData.title;
    let title = '';

    if (english) title += `\`${english}\`\n`;
    if (romaji) title += `• \`${romaji}\`\n`;
    if (native) title += `• \`${native}\`\n`;

    const description = animeData.description.replace(/<[^>]+>/g, ' ').substring(0, 300) + '...';
    const genres = animeData.genres.join(', ');
    const format = animeData.format;
    const startDate = `${animeData.startDate.day}-${animeData.startDate.month}-${animeData.startDate.year}`;
    const endDate = animeData.endDate 
      ? `${animeData.endDate.day}-${animeData.endDate.month}-${animeData.endDate.year}` 
      : 'Still Airing';
    const season = animeData.season;
    const seasonYear = animeData.seasonYear;
    const episodes = animeData.episodes || 'N/A';
    const status = animeData.status;
    const averageScore = animeData.averageScore;
    const id = animeData.id;
    const coverImage = `https://img.anili.st/media/${id}`;

    let relations = '';
    animeData.relations.edges.forEach(edge => {
      if (['PREQUEL', 'SEQUEL'].includes(edge.relationType)) {
        relations += `*${edge.relationType}:* \`${edge.node.title.english || edge.node.title.romaji}\`\n`;
      }
    });

    const { symbols } = global.config;

    const message = `
      ❏ *Title:* ${title}
      *${symbols} Type:* ${format}
      *${symbols} Genres:* ${genres}
      *${symbols} Start Date:* ${startDate}
      *${symbols} End Date:* ${endDate}
      *${symbols} Season:* ${season}, ${seasonYear}
      *${symbols} Episodes:* ${episodes}
      *${symbols} Status:* ${status}
      *${symbols} Score:* ${averageScore}
      ${relations ? `*${symbols} Relations:*\n${relations}` : ''}
      *${symbols} Description:* ${description}
      *${symbols} Link:* [View on AniList](https://anilist.co/anime/${id})
    `;

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    });

  } catch (error) {
    log.error("Error fetching anime information:", error);
    bot.sendMessage(chatId, 'An error occurred while fetching anime information. Try the romanji name or a proper name.');
  }
};
