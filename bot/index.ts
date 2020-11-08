import { Client, Message } from "discord.js";
import { config } from "dotenv";

config();
const client = new Client({});

client.on("ready", async () => {
  console.log("FUN Test is logged in.");
});

client.on("message", async (msg: Message) => {
  if (!msg.content.startsWith("_") || msg.author.bot || !msg.guild) return;

  msg.channel.startTyping();

  // remove prefix from message
  const command = msg.content.slice(1).trim().split(" ")[0].toLowerCase();
  const guildId: string = msg.guild.id;

  if (command === "team") msg.channel.send("Hi");

  await msg.channel.stopTyping();
});

client.login(process.env.DISCORD_TOKEN);
