import moment from "moment-timezone";

export const config = {
  name: "callad",
  aliases: ["call"],
  author: "Lance Cochangco",
  description: "Send a message to bot admin",
  usage: ["[message]"],
  cooldown: 5,
  access: "anyone",
  category: "communication"
};

export const onReply = async function({ bot, chatId, userId, msg, log, db, data, timeZone }) {
  const { type, target, messageId, author } = data;

  try {
    if (type === "adminReply" && global.config.admin.includes(userId.toString())) {
      await handleAdminReply({ bot, chatId, userId, msg, log, db, target, messageId, timeZone });
    } else if (type === "userReply") {
      await handleUserReply({ bot, chatId, userId, msg, log, db, author, timeZone });
    }
  } catch (err) {
    log.error("Error in onReply handler:", err);
    await bot.sendMessage(chatId, `❌ | Error: ${err.message}`);
  }
};

async function handleAdminReply({ bot, chatId, userId, msg, log, db, target, messageId, timeZone }) {
  if (global.client.replies.has(messageId)) return;

  const feedbackMessage = msg.text;
  const admin = await db.getUser(userId);
  const time = moment.tz(timeZone).format("LLLL");

  const info = await bot.sendMessage(
    target,
    `✉ Feedback from admin ${admin.name} to you:

💬 Content: ${feedbackMessage}
🕒 Time: ${time}

» Reply to this message if you want to continue sending admin reports.`,
    { reply_to_message_id: messageId }
  );

  global.client.replies.set(info.message_id, {
    commandName: config.name,
    type: "userReply",
    messageId: info.message_id,
    author: userId,
    target
  });

  await bot.sendMessage(chatId, `${global.config.symbols} Your message has been sent to the user.`);
}

async function handleUserReply({ bot, chatId, userId, msg, log, db, author, timeZone }) {
  if (global.client.replies.has(msg.message_id)) return;

  const userMessage = msg.text;
  const user = await db.getUser(userId);
  const time = moment.tz(timeZone).format("LLLL");

  const info = await bot.sendMessage(
    author,
    `✉️ Feedback from ${user.name}:

💬 Content: ${userMessage}
🕒 Time: ${time}

» Reply to this message if you want to continue sending feedback reports.`
  );

  global.client.replies.set(info.message_id, {
    commandName: config.name,
    type: "adminReply",
    messageId: msg.message_id,
    author: userId,
    target: chatId
  });

  await bot.sendMessage(chatId, `${global.config.symbols} Your reply has been sent to the admin.`);
}

export const onCommand = async function({ message, bot, chatId, userId, args, log, db, timeZone }) {
  try {
    const reportMessage = args.join(" ").trim();

    if (!reportMessage) {
      return bot.sendMessage(
        chatId,
        `${global.config.symbols} Please provide a message for the report.

Example:
${global.config.prefix}callad This is a report message.`
      );
    }

    const author = await db.getUser(userId);
    const adminList = global.config.admin;
    let successfulSends = 0;
    const time = moment.tz(timeZone).format("LLLL");

    for (const adminId of adminList) {
      try {
        const info = await bot.sendMessage(
          adminId,
          `👤 Report from: ${author.name}
💠 ID User: ${userId}
🌐 Group: ${message.chat.title || "Direct Message"}
🔰 ID Group: ${chatId}

✉️ Message: ${reportMessage}
🕒 Time: ${time}

Reply to this message to respond to the user.`
        );

        global.client.replies.set(info.message_id, {
          commandName: config.name,
          type: "adminReply",
          messageId: message.message_id,
          author: userId,
          target: chatId
        });

        successfulSends++;
      } catch (adminError) {
        log.error(`Failed to send report to admin ${adminId}:`, adminError);
      }
    }

    if (successfulSends > 0) {
      await bot.sendMessage(chatId, `📨 Your message has been successfully delivered to ${successfulSends} Admin(s).
🕒 Time: ${time}`);
    } else {
      throw new Error("Failed to send your message to any admin.");
    }
  } catch (err) {
    log.error("Error in onCommand handler:", err);
    await bot.sendMessage(chatId, `❌ | Error: ${err.message}`);
  }
};