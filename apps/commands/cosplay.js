import axios from 'axios';

export const config = {
  name: "cosplay",
  aliases: [],
  author: "Lance Cochangco",
  description: "Get a random cosplay video.",
  usage: [""],
  cooldown: 0,
  access: "anyone",
  category: "anime"
};

export const onCommand = async function({ message, bot, chatId, log }) {
  try {
    // Define the GitHub repository details
    const owner = 'ajirodesu';
    const repo = 'cosplay';
    const branch = 'main'; // Use the correct branch if it's different from 'main'
    
    // Construct the raw URL for the root of the repository
    const repoUrl = `https://github.com/${owner}/${repo}/tree/${branch}/`;

    // Scrape the directory to fetch video file names
    const response = await axios.get(repoUrl);
    const html = response.data;

    // Use a regular expression to extract video filenames from the HTML
    const videoFileRegex = /href="\/ajirodesu\/cosplay\/blob\/main\/([^"]+\.mp4)"/g;
    const videoFiles = [];
    let match;

    while ((match = videoFileRegex.exec(html)) !== null) {
        videoFiles.push(match[1]);
    }

    if (videoFiles.length === 0) {
      // No videos found in the repository
      await bot.sendMessage(chatId, "No cosplay videos found in the repository.");
      return;
    }

    // Select a random video from the list
    const randomVideo = videoFiles[Math.floor(Math.random() * videoFiles.length)];

    // Construct the raw URL for the selected video
    const videoUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${randomVideo}`;

    // Send the random cosplay video to the chat
    await bot.sendVideo(chatId, videoUrl, { caption: "Here's a random cosplay video!" });

  } catch (error) {
    log.error("Error fetching random video: " + error);
    // Send error message to the chat if the API request fails
    await bot.sendMessage(chatId, `An error occurred while fetching a cosplay video: ${error.message}`);
  }
};
