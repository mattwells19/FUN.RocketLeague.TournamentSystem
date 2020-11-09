import { MessageEmbed } from "discord.js";
import { ErrorEmbed, SuccessEmbed } from "./EmbedHelper";
import Teams, { ITeam } from "./Schemas/Teams";

// Validates the list of member IDs are not already on a team
const validateTeamPlayers = async (teamMemberIds: string[]): Promise<MessageEmbed | null> => {
  for (const id of teamMemberIds) {
    const playerOnTeam = await Teams.findOne({ players: id });
    if (playerOnTeam)
      return ErrorEmbed(
        "Player Already Registered",
        `<@${id}> is already registered on the team **${playerOnTeam.toJSON().teamName}**.`
      );
  }
  return null;
};

export async function newTeam(teamName: string, teamMemberIds: string[]): Promise<MessageEmbed> {
  try {
    const playerAlreadyRegistered = await validateTeamPlayers(teamMemberIds);
    if (playerAlreadyRegistered) return playerAlreadyRegistered;

    return new Teams({
      teamName,
      players: teamMemberIds,
      seed: 0,
      wins: 0,
      losses: 0,
    } as ITeam)
      .save()
      .then(() => SuccessEmbed("Team Registered", `**${teamName}** has been successfully registered.`))
      .catch((reason) => {
        const errorMessage = reason.message.split(":")[2].trim();
        return ErrorEmbed("Error Registering Team", `${errorMessage}`);
      });
  } catch (e) {
    return ErrorEmbed("Error Registering Team", `The server responded with ${e.message}.`);
  }
}
