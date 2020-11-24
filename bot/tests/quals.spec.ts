import { mocked } from "ts-jest/utils";
import { MessageEmbed } from "discord.js";
import { QualBuilder, QualMatchBuilder, TeamBuilder } from "./Builders";
import { startRound } from "../src/quals";
import * as ChannelHelper from "../src/ChannelHelper";
import * as Embed from "../src/EmbedHelper";
import generateMatchups from "../src/Swiss";
import Teams from "../Schemas/Teams";
import Qualifications from "../Schemas/Qualifications";

jest.mock("../Schemas/Teams");
jest.mock("../Schemas/Qualifications");
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

// FIXME
describe("Swiss tests", () => {
  it("returns error when not all teams are seeded", async () => {
    const mockTeam = TeamBuilder.single({ seed: -1 });
    mocked(Teams.get).mockResolvedValueOnce([mockTeam]);
    const response = await startRound();
    expect(response).toHaveProperty("title", "Not All Teams Seeded");
  });

  it("returns error when not all current matches are confirmed", async () => {
    const mockQualMatch = QualMatchBuilder.single({
      confirmed: false,
    });
    const mockQual = QualBuilder.single({ matches: [mockQualMatch] });
    mocked(Teams.get).mockResolvedValueOnce([]);
    mocked(Qualifications.get).mockResolvedValueOnce([mockQual]);
    const response = await startRound();
    expect(response).toHaveProperty("title", "Not All Matches Confirmed");
  });

  it("generates first round matches", async () => {
    mocked(Teams.get).mockResolvedValueOnce([]);
    mocked(Qualifications.get).mockResolvedValue([]);
    const mockQual = QualBuilder.single();
    mocked(generateMatchups).mockResolvedValueOnce([mockQual]);
    const addMatchesMock = mocked(Qualifications.insertMany).mockResolvedValueOnce([]);
    mocked(ChannelHelper.sendMatchDetails).mockResolvedValue();
    const response = await startRound();
    expect(response).toHaveProperty("title", "Matches Generated");
    expect(addMatchesMock).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ round: 1 })]));
  });
});
