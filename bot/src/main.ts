import { Collection, MessageEmbed, User } from "discord.js";
import { ErrorEmbed } from "./EmbedHelper";
import { startRound } from "./quals";
import { autoSeedTeams, getAllSeeds, getTeamSeed, resetSeeds, seedTeam } from "./seed";
import { newTeam } from "./team";

export default async function processCommands(
  command: string, // command with prefix removed
  author: User, // the author of the message (Discord User)
  args: string[], // the extra arguments with the mentions removed
  mentions: Collection<string, User> // the collection of mentions in the message
): Promise<string | MessageEmbed> {
  try {
    if (command === "team") {
      const teamWithAuthor = mentions.map((user) => user.id).concat(author.id);
      const team = Array.from(new Set(teamWithAuthor));
      const teamName = args.join(" ");
      return await newTeam(teamName, team);
    } else if (command === "seed") {
      if (args.length === 0) return await getAllSeeds();
      if (args.length === 1 && args[0] === "auto") return await autoSeedTeams();
      if (args.length === 1 && args[0] === "reset") return await resetSeeds();
      if (isNaN(parseInt(args[args.length - 1]))) {
        const teamName = args.join(" ");
        return await getTeamSeed(teamName);
      }
      const seed = parseInt(args.pop() ?? "-1");
      const teamName = args.join(" ");
      return await seedTeam(teamName, seed === 0 ? -1 : seed);
    } else if (command === "start") {
      // TODO - make admin command
      return await startRound();
    }
  } catch (e) {
    return ErrorEmbed("Error Processing Command", e.message);
  }
  return "Hello";
}
