import { MessageEmbed } from "discord.js";
import Qualification, { IQualification } from "../Schemas/Qualifications";
import Teams from "../Schemas/Teams";
import { CommandFunctionType } from "./Commands";
import { ErrorEmbed, SuccessEmbed } from "./EmbedHelper";

const reportCommand: CommandFunctionType = async ({ authorId, args }) => {
  const [winningTeamScore, losingTeamScore] = args[0].split("-");
  return await reportMatch(authorId, parseInt(winningTeamScore), parseInt(losingTeamScore));
};
export default reportCommand;

async function reportMatch(reporterId: string, winnerScore: number, loserScore: number): Promise<MessageEmbed> {
  const reporterTeam = await Teams.getOne({ players: reporterId });

  if (!reporterTeam) throw Error("Reporter's team not found");

  const latestMatch = await Qualification.get({
    $or: [{ blueTeam: reporterTeam._id }, { orangeTeam: reporterTeam._id }],
  }).then((matchesWithReporter) => matchesWithReporter.reduce((prev, curr) => (curr.round > prev.round ? curr : prev)));

  if (latestMatch.matches.find((game) => game.reported && game.reported.equals(reporterTeam._id) && !game.confirmed)) {
    return ErrorEmbed(
      "Previous Match Not Confirmed",
      "You cannot report the next match until the previous match has been confirmed."
    );
  }

  const currGameIndex = latestMatch.matches.findIndex((game) => !game.reported);

  if (currGameIndex < 0) return ErrorEmbed("No Matches to Report", "There are no matches to report.");

  const matchUpdate: IQualification = { ...latestMatch };
  const blueTeamReported = reporterTeam._id.equals(latestMatch.blueTeam);

  matchUpdate.matches[currGameIndex] = {
    ...matchUpdate.matches[currGameIndex],
    blueScore: blueTeamReported ? winnerScore : loserScore,
    orangeScore: blueTeamReported ? loserScore : winnerScore,
    reported: reporterTeam._id,
  };

  await Qualification.updateWithId(latestMatch._id, matchUpdate);
  return SuccessEmbed("Match Reported", "Match reported. Awaiting confirmation.");
}
