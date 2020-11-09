import { Collection, MessageEmbed, User } from "discord.js";
import { newTeam } from "./team";

export default async function processCommands(
  command: string, // command with prefix removed
  author: User, // the author of the message (Discord User)
  args: string[], // the extra arguments with the mentions removed
  mentions: Collection<string, User> // the collection of mentions in the message
): Promise<string | MessageEmbed> {
  if (command === "team") {
    const teamWithAuthor = mentions.map((user) => user.id).concat(author.id);
    const team = Array.from(new Set(teamWithAuthor));
    const teamName = args.join(" ");
    return await newTeam(teamName, team);
  }
  return "Hello";
}
