import { mocked } from "ts-jest/utils";
import generateMatchups from "../src/Swiss";
import { QualBuilder, QualMatchBuilder, TeamBuilder } from "./Builders";
import * as TeamsAsync from "../Schemas/TeamsAsync";
import * as QualificationsAsync from "../Schemas/QualificationsAsync";
import { MessageEmbed } from "discord.js";
import { startRound } from "../src/quals";

jest.mock("../Schemas/TeamsAsync");
jest.mock("../Schemas/QualificationsAsync");
jest.mock("../src/Swiss");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Swiss tests", () => {
  it("returns error when not all teams are seeded", async () => {
    const mockTeam = TeamBuilder.single({ seed: -1 });
    mocked(TeamsAsync.getTeams).mockResolvedValueOnce([mockTeam]);
    const response: MessageEmbed = await startRound();
    expect(response).toHaveProperty("title", "Not All Teams Seeded");
  });

  it("returns error when not all current matches are confirmed", async () => {
    const mockQualMatch = QualMatchBuilder.single({
      confirmed: false,
    });
    const mockQual = QualBuilder.single({ matches: [mockQualMatch] });
    mocked(TeamsAsync.getTeams).mockResolvedValueOnce([]);
    mocked(QualificationsAsync.getAllMatches).mockResolvedValueOnce([mockQual]);
    const response: MessageEmbed = await startRound();
    expect(response).toHaveProperty("title", "Not All Matches Confirmed");
  });

  it("generates first round matches", async () => {
    mocked(TeamsAsync.getTeams).mockResolvedValueOnce([]);
    mocked(QualificationsAsync.getAllMatches).mockResolvedValue([]);
    const mockQual = QualBuilder.single();
    mocked(generateMatchups).mockResolvedValueOnce([mockQual]);
    const addMatchesMock = mocked(QualificationsAsync.addMatches).mockResolvedValueOnce();
    const response: MessageEmbed = await startRound();
    expect(response).toHaveProperty("title", "Matches Generated");
    expect(addMatchesMock).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ round: 1 })]));
  });
});
