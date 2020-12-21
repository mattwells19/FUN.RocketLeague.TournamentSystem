import { Message, MessageEmbed } from "discord.js";
import { ErrorEmbed } from "./EmbedHelper";
import confirmCommand from "./confirm";
import reportCommand from "./report";
import seedCommand from "./seed";
import teamCommand from "./team";
import tournamentCommand from "./tournament";
import BotCommands from "./Commands";
import channelsCommand from "./channels";
import startCommand from "./quals";

export const registerCommands = (): void => {
  BotCommands.registerCommand("team", teamCommand);
  BotCommands.registerCommand("seed", seedCommand, true);
  BotCommands.registerCommand("channels", channelsCommand, true);
  BotCommands.registerCommand("report", reportCommand);
  BotCommands.registerCommand("start", startCommand);
  BotCommands.registerCommand("confirm", confirmCommand);
  BotCommands.registerCommand("new", tournamentCommand, true);
};

export default async function processCommand(msg: Message): Promise<MessageEmbed> {
  try {
    // remove prefix from message
    const args = msg.content
      .slice(1)
      .trim()
      .split(/ +/)
      .filter((x) => !x.startsWith("<"));
    const command = args.splice(0, 1)[0].toLowerCase();
    const mentionsIds = msg.mentions.users.filter((user) => !user.bot).map((user) => user.id);
    const authorId = msg.author.id;
    const isAdmin = msg.channel.id === process.env.ADMIN_CHANNEL_ID;

    return await BotCommands.processCommand(command, { authorId, args, mentionsIds, isAdmin });
  } catch (e) {
    return ErrorEmbed("Error Processing Command", e.stack);
  }
}
