import { MessageEmbed } from "discord.js";
import Teams from "../Schemas/Teams";
import { createTeamChannels } from "./ChannelHelper";
import { CommandFunctionType } from "./Commands";
import { SuccessEmbed } from "./EmbedHelper";

const channelsCommand: CommandFunctionType = async () => {
  return await createChannels();
};
export default channelsCommand;

async function createChannels(): Promise<MessageEmbed> {
  const teams = await Teams.get({});
  await createTeamChannels(teams);
  return SuccessEmbed("Team Channels Created", "Each team now has their own Discord channel.");
}
