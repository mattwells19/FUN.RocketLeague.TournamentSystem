import { mocked } from "ts-jest/utils";
import { MessageEmbed } from "discord.js";
import { QualBuilder, QualMatchBuilder, TeamBuilder, TournamentBuilder } from "./Builders";
import startCommand from "../src/quals";
import * as ChannelHelper from "../src/ChannelHelper";
import * as Embed from "../src/EmbedHelper";
import generateMatchups from "../src/Swiss";
import Teams from "../Schemas/Teams";
import Qualifications from "../Schemas/Qualifications";
import { ICommandParameters } from "../src/Commands";
import * as faker from "faker";
import Tournaments from "../Schemas/Tournaments";

jest.mock("../Schemas/Teams");
jest.mock("../Schemas/Qualifications");
jest.mock("../Schemas/Tournaments");
jest.mock("../src/Swiss");
jest.mock("../src/ChannelHelper");
jest.mock("../src/EmbedHelper");
jest.mock("discord.js");
jest.mock("mongoose");

beforeEach(() => {
  jest.clearAllMocks();
  mocked(Embed.ErrorEmbed).mockImplementation(
    (title, desc) =>
      ({
        title,
        description: desc,
      } as MessageEmbed)
  );
  mocked(Embed.SuccessEmbed).mockImplementation(
    (title, desc) =>
      ({
        title,
        description: desc,
      } as MessageEmbed)
  );
});

describe("Swiss tests", () => {
  it("returns error when not all teams are seeded", async () => {
    mocked(Tournaments.getOne).mockResolvedValueOnce(TournamentBuilder.single({ numOfQualRounds: -1 }));

    const mockTeam = TeamBuilder.single({ seed: -1 });
    mocked(Teams.get).mockResolvedValue([mockTeam]);

    const response = await startCommand({
      args: [faker.random.number().toString(), faker.random.number().toString()],
    } as ICommandParameters);

    expect(response).toHaveProperty("title", "Not All Teams Seeded");
  });

  it("returns error when not all current matches are confirmed", async () => {
    mocked(Tournaments.getOne).mockResolvedValueOnce(TournamentBuilder.single({ numOfQualRounds: -1 }));
    mocked(Teams.get).mockResolvedValue([]);

    const mockQualMatch = QualMatchBuilder.single({
      confirmed: false,
    });
    const mockQual = QualBuilder.single({ matches: [mockQualMatch] });
    mocked(Qualifications.get).mockResolvedValueOnce([mockQual]);

    const response = await startCommand({
      args: [faker.random.number().toString(), faker.random.number().toString()],
    } as ICommandParameters);

    expect(response).toHaveProperty("title", "Not All Matches Confirmed");
  });

  it("generates first round matches", async () => {
    mocked(Tournaments.getOne).mockResolvedValueOnce(TournamentBuilder.single({ numOfQualRounds: -1 }));
    mocked(Teams.get).mockResolvedValue([]);
    mocked(Qualifications.get).mockResolvedValue([]);
    mocked(ChannelHelper.sendMatchDetails).mockResolvedValue();

    const mockQual = QualBuilder.single();
    mocked(generateMatchups).mockResolvedValueOnce([mockQual]);
    const addMatchesMock = mocked(Qualifications.insertMany).mockResolvedValueOnce([]);

    const response = await startCommand({
      args: [faker.random.number().toString(), faker.random.number().toString()],
    } as ICommandParameters);

    expect(response).toHaveProperty("title", "Matches Generated");
    expect(addMatchesMock).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ round: 1 })]));
  });
});
