import { Collection, MessageEmbed, User } from "discord.js";
import createTeamChannels from "./ChannelHelper";
import confirmMatch from "./confirm";
import { ErrorEmbed } from "./EmbedHelper";
import { startRound } from "./quals";
import reportMatch from "./report";
import { autoSeedTeams, getAllSeeds, getTeamSeed, resetSeeds, seedTeam } from "./seed";
import { newTeam } from "./team";
import { deleteTournament, newTournament, listTournaments } from "./tournament";

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
      const teamName = args.join(" ").trim();
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
    } else if (command === "channels") {
      // TODO - should not be its own command
      await createTeamChannels();
    } else if (command === "report") {
      const [winningTeamScore, losingTeamScore] = args[0].split("-");
      return await reportMatch(author.id, parseInt(winningTeamScore), parseInt(losingTeamScore));
    } else if (command === "confirm") {
      return await confirmMatch(author.id);
    } else if (command === "tournament") {
      // TODO - make admin command
      if (args.length === 0) {
        return await listTournaments();
      } else if (args.includes("delete")) {
        const tournamentName = args.filter((value) => value !== "delete").join(" ");
        return await deleteTournament(tournamentName);
      } else {
        const tournamentDate = args.pop() ?? "";
        const tournamentName = args.join(" ").trim();
        return await newTournament(tournamentName, tournamentDate);
      }
    }
  } catch (e) {
    return ErrorEmbed("Error Processing Command", e.stack);
  }
  return "Hello";
}
