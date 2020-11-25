import { MessageEmbed } from "discord.js";
import { mocked } from "ts-jest/utils";
import channelsCommand from "../src/channels";
import Teams from "../Schemas/Teams";
import * as ChannelHelper from "../src/ChannelHelper";
import * as Embed from "../src/EmbedHelper";
import { ICommandParameters } from "../src/Commands";

jest.mock("../Schemas/Teams");
jest.mock("../src/ChannelHelper");
jest.mock("../src/EmbedHelper");
jest.mock("discord.js");
jest.mock("mongoose");

beforeEach(() => {
  jest.clearAllMocks();
  mocked(Embed.SuccessEmbed).mockImplementation(
    (title, desc) =>
      ({
        title,
        description: desc,
      } as MessageEmbed)
  );
});

async function runChannelsCommand(): Promise<MessageEmbed> {
  return await channelsCommand({} as ICommandParameters);
}

describe("channels command tests", () => {
  it("returns success message when channels created successfully", async () => {
    mocked(Teams.get).mockResolvedValueOnce([]);
    mocked(ChannelHelper.createTeamChannels).mockResolvedValueOnce();
    const response = await runChannelsCommand();
    expect(response).toHaveProperty("title", "Team Channels Created");
  });
});
