import { MessageEmbed } from "discord.js";
import { ErrorEmbed, SuccessEmbed } from "./EmbedHelper";
import generateMatchups from "./Swiss";
import { createTeamChannels, sendMatchDetails } from "./ChannelHelper";
import Qualification, { IQualification } from "../Schemas/Qualifications";
import Teams from "../Schemas/Teams";
import { CommandFunctionType } from "./Commands";
import Tournaments from "../Schemas/Tournaments";

const startCommand: CommandFunctionType = async ({ args }) => {
  const numOfQualRounds = parseInt(args[0]);
  const qualBestOfs = parseInt(args[1]);
  await createChannels(); // need to create team channels before we can send match details
  const startMsg = await startRound(qualBestOfs);
  await updateTournamentDetails(numOfQualRounds, qualBestOfs);
  return startMsg;
};
export default startCommand;

async function updateTournamentDetails(numOfQualRounds: number, qualBestOfs: number): Promise<void> {
  const activeTourney = await Tournaments.getOne({ numOfQualRounds: -1 });
  if (!activeTourney) throw Error("No active tournaments.");
  else
    await Tournaments.updateWithId(activeTourney._id, {
      numOfQualRounds,
      bestOfs: {
        quals: qualBestOfs,
      },
    });
}

async function createChannels(): Promise<MessageEmbed> {
  const teams = await Teams.get({});
  await createTeamChannels(teams);
  return SuccessEmbed("Team Channels Created", "Each team now has their own Discord channel.");
}

async function startRound(roundBestOf: number): Promise<MessageEmbed> {
  const teams = await Teams.get({ seed: -1 });
  if (teams.length > 0) {
    return ErrorEmbed(
      "Not All Teams Seeded",
      "Every team must have a seed before you can start the round. To auto assign seeds, type `-seed auto`."
    );
  } else {
    const previousMatches = await Qualification.get({});
    if (previousMatches.some((m) => m.matches.some((n) => !n.confirmed))) {
      return ErrorEmbed("Not All Matches Confirmed", "Cannot start the next round until all matches are confirmed.");
    } else {
      const matches = await generateMatchups();
      const lastRound =
        previousMatches.length > 0
          ? previousMatches.reduce((prev, curr) => (prev.round > curr.round ? prev : curr)).round
          : 0;
      const newRoundMatches: IQualification[] = matches.map((m) => ({ ...m, round: lastRound + 1 }));
      await Qualification.insertMany(newRoundMatches).then((matches: IQualification[]) =>
        sendMatchDetails(matches, roundBestOf)
      );
      return SuccessEmbed(
        "Matches Generated",
        "Qualification matches have been generated and teams have been notified."
      );
    }
  }
}
