import { Message, MessageEmbed, OverwriteResolvable, TextChannel } from "discord.js";
import { uniqueNamesGenerator, Config, adjectives, colors, animals } from "unique-names-generator";
import { IQualification } from "../Schemas/Qualifications";
import Teams, { ITeam } from "../Schemas/Teams";
import { InfoEmbed, SuccessEmbed } from "./EmbedHelper";
import { client } from "./index";

interface ILobbyInfo {
  username: string;
  password: string;
}

async function fetchGuild() {
  return await client.guilds.fetch(process.env.GUILD_ID ?? "");
}

export async function createTeamChannels(teams: ITeam[]): Promise<void> {
  const Guild = await fetchGuild();

  for (const team of teams) {
    // have to actually get users or else the Discord API won't recognize the user id
    const discordUsers = await Promise.all(team.players.map(async (pId) => await client.users.fetch(pId)));
    const permissions: OverwriteResolvable[] = discordUsers
      // grants necessary permissions to players for the team channel
      .map<OverwriteResolvable>((user) => ({
        id: user.id,
        allow: [
          "SEND_MESSAGES",
          "ADD_REACTIONS",
          "VIEW_CHANNEL",
          "MANAGE_MESSAGES",
          "ATTACH_FILES",
          "READ_MESSAGE_HISTORY",
        ],
      }))
      // need to deny permission to the everyone role so it's private
      .concat([
        {
          id: Guild.roles.everyone.id,
          deny: ["VIEW_CHANNEL"],
        } as OverwriteResolvable,
      ]);
    await Guild.channels
      // create the channel with the team name lowercased and no spaces as Discord doesn't support spaces
      .create(team.teamName.toLowerCase().replace(" ", "-"), {
        permissionOverwrites: permissions,
        parent: process.env.TEAMS_CATEGORY_ID,
      })
      // once the channel gets created send the team a message letting them know it's up
      .then(async (newChannel) => {
        const teamChannelIdPromise = Teams.updateWithId(team._id, { channelId: newChannel.id });
        const newChannelMsg = newChannel.send(
          SuccessEmbed(
            `Welcome to your team chat ${team.teamName}!`,
            "This is where your team will receive updates on your matches, communicate with admins, and report matches.\n\nPlease hang tight for your first match."
          )
        );
        return Promise.all([teamChannelIdPromise, newChannelMsg]);
      });
  }
}

export async function sendMatchDetails(matches: IQualification[]): Promise<void> {
  for (const match of matches) {
    const blueTeamPromise = Teams.getWithId(match.blueTeam);
    const orangeTeamPromise = Teams.getWithId(match.orangeTeam);
    const [blueTeam, orangeTeam] = await Promise.all([blueTeamPromise, orangeTeamPromise]);

    if (!blueTeam || !orangeTeam) throw Error("Did not find orange or blue team when sending match details");

    const matchDetails = (team: ITeam, opponent: ITeam, lobbyInfo: ILobbyInfo): Promise<Message> => {
      return client.channels.fetch(team.channelId).then((channel) => {
        const teamChannel = channel as TextChannel;
        return teamChannel.send(MatchReadyEmbed(opponent, match, lobbyInfo));
      });
    };

    const lobbyInfo = generateLobbyInfo();
    await Promise.all([matchDetails(blueTeam, orangeTeam, lobbyInfo), matchDetails(orangeTeam, blueTeam, lobbyInfo)]);
  }
}

const generateLobbyInfo = (): ILobbyInfo => {
  const customConfig: Config = {
    dictionaries: [adjectives, colors, animals],
    separator: "-",
    length: 3,
  };
  return { username: uniqueNamesGenerator(customConfig), password: uniqueNamesGenerator(customConfig) };
};

const MatchReadyEmbed = (opponent: ITeam, match: IQualification, lobbyInfo: ILobbyInfo): MessageEmbed => {
  const isBlueTeam = opponent._id.equals(match.orangeTeam);

  return InfoEmbed("Your match is ready!", `Match ID: ${match._id}`)
    .addField(
      isBlueTeam ? "You are the 🔹Blue Team🔹" : "You are the 🔸Orange Team🔸",
      isBlueTeam
        ? "Please create the private match using the lobby info outlined below."
        : "Please join the lobby using the info outlined below."
    )
    .addField("Lobby Info", `__Username:__ ${lobbyInfo.username}\n__Password:__ ${lobbyInfo.password}`, false)
    .addField(
      "Opponent",
      `__Team Name:__ ${opponent.teamName}\nPing <@${opponent.players[0]}> if you need to contact your opponent.`,
      false
    )
    .addField(
      "Report Your Matches",
      `You must report each game with the score.
__The winning team reports the game, the losing team will confirm the score.__
To report a game, type \`-report [your score]-[opponents score]\` without the square brackets.
  Ex: \`!report 4-2\``,
      false
    );
};
