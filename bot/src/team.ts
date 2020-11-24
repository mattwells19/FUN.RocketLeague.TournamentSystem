import { MessageEmbed } from "discord.js";
import { ErrorEmbed, SuccessEmbed } from "./EmbedHelper";
import Teams from "../Schemas/Teams";

// Validates the list of member IDs are not already on a team
const validateTeamPlayers = async (teamMemberIds: string[]): Promise<MessageEmbed | null> => {
  for (const id of teamMemberIds) {
    const playerOnTeam = await Teams.getOne({ players: id });
    if (playerOnTeam)
      return ErrorEmbed(
        "Player Already Registered",
        `<@${id}> is already registered on the team **${playerOnTeam.teamName}**.`
      );
  }
  return null;
};

export async function newTeam(teamName: string, teamMemberIds: string[]): Promise<MessageEmbed> {
  if (teamName === "") return ErrorEmbed("Error Registering Team", "You must provide a team name to register.");

  const playerAlreadyRegistered = await validateTeamPlayers(teamMemberIds);
  if (playerAlreadyRegistered) return playerAlreadyRegistered;

  const teamNameTaken = await Teams.getOne({ teamName: new RegExp(`^${teamName}$`, "i") });
  if (teamNameTaken)
    return ErrorEmbed(
      "Team Name Taken",
      `There is already a team with the name **${teamName}**. Please choose something else.`
    );

  if (teamMemberIds.length !== 3)
    return ErrorEmbed("Error Registering Team", `You need 3 players to make a team. Found ${teamMemberIds.length}`);

  return Teams.insert({
    teamName,
    players: teamMemberIds,
    channelId: "",
    seed: 0,
    wins: 0,
    losses: 0,
  })
    .then(() => SuccessEmbed("Team Registered", `**${teamName}** has been successfully registered.`))
    .catch((reason) => {
      const errorMessage = reason.message.split(":")[2].trim();
      return ErrorEmbed("Error Registering Team", `${errorMessage}`);
    });
}
