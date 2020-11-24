import { MessageEmbed } from "discord.js";
import { ErrorEmbed, SuccessEmbed } from "./EmbedHelper";
import generateMatchups from "./Swiss";
import { sendMatchDetails } from "./ChannelHelper";
import Qualification, { IQualification } from "../Schemas/Qualifications";
import Teams from "../Schemas/Teams";

export async function startRound(): Promise<MessageEmbed> {
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
      await Qualification.insertMany(newRoundMatches).then(sendMatchDetails);
      return SuccessEmbed(
        "Matches Generated",
        "Qualification matches have been generated and teams have been notified."
      );
    }
  }
}
