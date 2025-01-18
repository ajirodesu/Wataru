import axios from "axios";
import fs from "fs";
import path from "path";

// Fetch the base API URL
const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`
  );
  return base.data.api;
};

// Define the bot command
export const setup = {
  name: "autodl",
  author: "Dipto",
  version: "0.0.1",
  description: "Auto download video from TikTok, Facebook, Instagram, YouTube, and more.",
};

// Regular expression to match valid URLs
const extractLinkFromMessage = (messageText) => {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const match = messageText.match(urlPattern);
  return match ? match[0] : null;
};

export const onEvent = async function ({ bot, msg, chatId, userId, args, log }) {
  try {
    // Get the message text and extract the first valid link
    const messageText = args?.[0] || msg?.text || "";
    const link = extractLinkFromMessage(messageText);

    // If no valid link is found, do nothing
    if (!link) {
      return;
    }

    // Check if the link is from a supported platform
    const isSupportedLink =
      link.startsWith("https://vt.tiktok.com") ||
      link.startsWith("https://www.tiktok.com/") ||
      link.startsWith("https://www.facebook.com") ||
      link.startsWith("https://www.instagram.com") ||
      link.startsWith("https://youtu.be/") ||
      link.startsWith("https://youtube.com/") ||
      link.startsWith("https://x.com/") ||
      link.startsWith("https://twitter.com/") ||
      link.startsWith("https://vm.tiktok.com") ||
      link.startsWith("https://fb.watch");

    // If the link is not supported, do nothing
    if (!isSupportedLink) {
      return;
    }

    const messageId = msg?.message_id;

    // Send processing message
    const waitMessage = await bot.sendMessage(chatId, "⏳ Processing your request...", {
      reply_to_message_id: messageId,
    });

    // Store the ID of the "processing" message
    const waitMessageId = waitMessage.message_id;
    const videoPath = path.join(process.cwd(), "app", "temp", "diptoo.mp4");

    // Fetch the video URL from the API
    const { data } = await axios.get(
      `${await baseApiUrl()}/alldl?url=${encodeURIComponent(link)}`
    );

    const videoBuffer = (await axios.get(data.result, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(videoPath, Buffer.from(videoBuffer));

    // Delete the "processing" message
    await bot.deleteMessage(chatId, waitMessageId);

    // Send the video as a stream
    await bot.sendVideo(
      chatId,
      fs.createReadStream(videoPath),
      {
        caption: `${data.cp || ""}✅`,
        reply_to_message_id: messageId,
      },
      {
        filename: "video.mp4",
        contentType: "video/mp4",
      }
    );

    // Clean up the video file
    fs.unlinkSync(videoPath);
  } catch (error) {
    log.error("Error downloading video:", error);
    await bot.sendMessage(chatId, `❎ Error: ${error.message}`);
  }
};
