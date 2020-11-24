import { MessageEmbed } from "discord.js";
import { IMatch, IQualification } from "../Schemas/Qualifications";
import { getMatches, updateMatchWithId } from "../Schemas/QualificationsAsync";
import { findAndUpdateTeamWithId, getTeam } from "../Schemas/TeamsAsync";
import { ErrorEmbed, SuccessEmbed } from "./EmbedHelper";

const determineWinningTeam = (match: IQualification): "blue" | "orange" => {
  let blueWins = 0,
    orangeWins = 0;
  match.matches.forEach((game) => {
    if (game.blueScore > game.orangeScore) blueWins++;
    else orangeWins++;
  });
  return blueWins > orangeWins ? "blue" : "orange";
};

export default async function confirmMatch(confirmerId: string): Promise<MessageEmbed> {
  const confirmerTeam = await getTeam({ players: confirmerId });

  if (!confirmerTeam) throw Error("Confirmer's team not found");

  const latestMatch = await getMatches(confirmerTeam._id).then((matchesWithReporter) =>
    matchesWithReporter.reduce((prev, curr) => (curr.round > prev.round ? curr : prev))
  );
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
    const blueTeamUpdatePromise = findAndUpdateTeamWithId(matchUpdate.blueTeam, {
      $inc: blueTeamWonSeries ? { wins: 1 } : { losses: 1 },
    });
    const orangeTeamUpdatePromise = findAndUpdateTeamWithId(matchUpdate.orangeTeam, {
      $inc: !blueTeamWonSeries ? { wins: 1 } : { losses: 1 },
    });
    await Promise.all([blueTeamUpdatePromise, orangeTeamUpdatePromise]);
  }

  await updateMatchWithId(latestMatch._id, matchUpdate);
  return SuccessEmbed(
    "Match Confirmed",
    isEndOfSeries
      ? "The series is over. Please hang tight until the next round matches are ready."
      : "You are clear to play your next game. Good luck!"
  );
}
