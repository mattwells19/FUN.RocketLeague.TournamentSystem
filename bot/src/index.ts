import { Client, Message } from "discord.js";
import { config } from "dotenv";
import { connect } from "mongoose";
import processCommand, { registerCommands } from "./main";

config();
export const client = new Client();

const prefix = process.env.NODE_ENV === "dev" ? "_" : "-";

client.on("ready", async () => {
  if (process.env.NODE_ENV === "dev") console.log("FUN Test is logged in.");
  else console.log("FUN Tournaments is logged in.");
  registerCommands();
});

client.on("message", async (msg: Message) => {
  if (!msg.content.startsWith(prefix) || msg.author.bot) return;

  msg.channel.startTyping();
  await msg.channel.send(await processCommand(msg));
  await msg.channel.stopTyping();
});

client.login(process.env.DISCORD_TOKEN);
connect(
  process.env.MONGO_CONNECT ?? "",
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  },
  () => console.log("Connected to MongoDB!")
);
