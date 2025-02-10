exports.setup = {
  name: "callad",
  aliases: [],
  version: "1.3.0",
  author: "NTKhang, ManhG Fix Get, Enhanced by AjiroDesu",
  description: "Report bot errors or feedback to admins and maintain a continuous conversation.",
  guide: "[Error encountered or comments]",
  cooldown: 5,
  type: "anyone",
  category: "report"
};

// Handles ongoing conversations between users and admins
exports.onReply = async function({ bot, msg, chatId, args, data }) {
  const senderName = `${msg.from.first_name || 'Unknown'} ${msg.from.last_name || ''}`.trim();
  const groupName = msg.chat.title || "Private Chat";
  const groupId = msg.chat.id;

  if (data.type === "reply") {
    // User is replying to an admin.
    for (let adminId of global.config.admin) {
      await bot.sendMessage(adminId, `📩 **New Reply from ${senderName}**\n📌 **Group:** ${groupName} (**ID:** \`${groupId}\`)\n💬 **Message:**\n${msg.text}`, {
        parse_mode: "Markdown",
        reply_markup: { force_reply: true }
      }).then(sentMsg => {
        global.client.replies.set(sentMsg.message_id, {
          setup: exports.setup,
          type: "calladmin",
          userId: data.userId,
          groupName,
          groupId
        });
      });
    }
  } else if (data.type === "calladmin") {
    // Admin is replying to the user.
    await bot.sendMessage(data.userId, `📌 **Admin Response from ${senderName}**\n📌 **Group:** ${data.groupName} (**ID:** \`${data.groupId}\`)\n💬 **Message:**\n${msg.text}\n\n➡ **Reply to continue the conversation.**`, {
      parse_mode: "Markdown",
      reply_markup: { force_reply: true }
    }).then(sentMsg => {
      global.client.replies.set(sentMsg.message_id, {
        setup: exports.setup,
        type: "reply",
        userId: data.userId,
        groupName: data.groupName,
        groupId: data.groupId
      });
    });
  }
};

// Handles initial reports
exports.onStart = async function({ bot, msg, chatId, args, userId }) {
  if (!args[0]) {
    return await bot.sendMessage(chatId, "❌ **Please enter the content to report.**", { parse_mode: "Markdown" });
  }

  const userName = `${msg.from.first_name || 'Unknown'} ${msg.from.last_name || ''}`.trim();
  const groupName = msg.chat.title || "Private Chat";
  const groupId = msg.chat.id;
  const moment = require("moment-timezone");
  const currentTime = moment.tz("Asia/Manila").format("HH:mm:ss D/MM/YYYY");

  // Notify the user that their report has been sent
  await bot.sendMessage(chatId, `✅ **Report sent!**\n📅 **Time:** ${currentTime}`, { parse_mode: "Markdown" });

  // Send the report to all admins
  for (let adminId of global.config.admin) {
    const reportText = 
      `📩 **New Report**\n👤 **From:** ${userName}\n🔰 **Group:** ${groupName} (**ID:** \`${groupId}\`)\n🆔 **User ID:** \`${userId}\`\n` +
      `-----------------\n⚠ **Report:** ${args.join(" ")}\n-----------------\n🕒 **Time:** ${currentTime}`;

    await bot.sendMessage(adminId, reportText, {
      parse_mode: "Markdown",
      reply_markup: { force_reply: true }
    }).then(sentMsg => {
      global.client.replies.set(sentMsg.message_id, {
        setup: exports.setup,
        type: "calladmin",
        userId: chatId,
        groupName,
        groupId
      });
    });
  }
};
