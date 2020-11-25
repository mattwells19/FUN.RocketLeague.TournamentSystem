import { MessageEmbed } from "discord.js";
import Qualification, { IMatch, IQualification } from "../Schemas/Qualifications";
import { ErrorEmbed, SuccessEmbed } from "./EmbedHelper";
import Teams from "../Schemas/Teams";
import { CommandFunctionType } from "./Commands";

const confirmCommand: CommandFunctionType = async ({ authorId }) => {
  return await confirmMatch(authorId);
};
export default confirmCommand;

const determineWinningTeam = (match: IQualification): "blue" | "orange" => {
  let blueWins = 0,
    orangeWins = 0;
  match.matches.forEach((game) => {
    if (game.blueScore > game.orangeScore) blueWins++;
    else orangeWins++;
  });
  return blueWins > orangeWins ? "blue" : "orange";
};

async function confirmMatch(confirmerId: string): Promise<MessageEmbed> {
  const confirmerTeam = await Teams.getOne({ players: confirmerId });

  if (!confirmerTeam) throw Error("Confirmer's team not found");

  const latestMatch = await Qualification.get({
    $or: [{ blueTeam: confirmerTeam._id }, { orangeTeam: confirmerTeam._id }],
  }).then((matchesWithReporter) => matchesWithReporter.reduce((prev, curr) => (curr.round > prev.round ? curr : prev)));
  const currGameIndex = latestMatch.matches.findIndex((game) => game.reported && !game.confirmed);

  if (currGameIndex < 0)
    return ErrorEmbed("No Matches Reported", "Either the match is already confirmed or it has not been reported yet.");

  const reportingTeam = latestMatch.matches[currGameIndex].reported;
  if (reportingTeam && reportingTeam.equals(confirmerTeam._id))
    return ErrorEmbed("Cannot Confirm Match", "Your team reported the match, you can't also confirm it.");

  const matchUpdate: IQualification = { ...latestMatch };

  matchUpdate.matches[currGameIndex] = {
    ...matchUpdate.matches[currGameIndex],
    confirmed: true,
  };

  const isEndOfSeries = false; // TODO - https://trello.com/c/pc8g5enh/20-complete-round-when-enough-matches-were-reported

  if (!isEndOfSeries) {
    matchUpdate.matches.push({} as IMatch);
  } else {
    const blueTeamWonSeries = determineWinningTeam(matchUpdate) === "blue";
    const blueTeamUpdatePromise = Teams.updateWithId(matchUpdate.blueTeam, {
      $inc: blueTeamWonSeries ? { wins: 1 } : { losses: 1 },
    });
    const orangeTeamUpdatePromise = Teams.updateWithId(matchUpdate.orangeTeam, {
      $inc: !blueTeamWonSeries ? { wins: 1 } : { losses: 1 },
    });
    await Promise.all([blueTeamUpdatePromise, orangeTeamUpdatePromise]);
  }

  await Qualification.updateWithId(latestMatch._id, matchUpdate);
  return SuccessEmbed(
    "Match Confirmed",
    isEndOfSeries
      ? "The series is over. Please hang tight until the next round matches are ready."
      : "You are clear to play your next game. Good luck!"
  );
}
