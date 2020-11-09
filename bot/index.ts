import { Client, Message } from "discord.js";
import { config } from "dotenv";
import { connect } from "mongoose";
import processCommands from "./main";

config();
const client = new Client();

const prefix = process.env.NODE_ENV === "dev" ? "_" : "-";

client.on("ready", async () => {
  if (process.env.NODE_ENV === "dev") console.log("FUN Test is logged in.");
  else console.log("FUN Tournaments is logged in.");
});

client.on("message", async (msg: Message) => {
  if (!msg.content.startsWith(prefix) || msg.author.bot) return;

  msg.channel.startTyping();

  // remove prefix from message
  const args = msg.content
    .slice(1)
    .trim()
    .split(/ +/)
    .filter((x) => !x.startsWith("<"));
  const command = args.splice(0, 1)[0].toLowerCase();
  const mentions = msg.mentions.users.filter((user) => !user.bot);
  const author = msg.author;

  // console.log(command);
  // console.log(args);
  // console.log(mentions);

  await msg.channel.send(
    await processCommands(command, author, args, mentions)
  );

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
