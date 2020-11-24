import { mocked } from "ts-jest/utils";
import * as TeamsAsync from "../Schemas/TeamsAsync";
import * as QualificationsAsync from "../Schemas/QualificationsAsync";
import { generateMatchScores, QualBuilder, QualMatchBuilder, TeamBuilder } from "./Builders";
import reportMatch from "../src/report";
import * as faker from "faker";
import { IMatch, IQualification } from "../Schemas/Qualifications";

jest.mock("../Schemas/TeamsAsync");
jest.mock("../Schemas/QualificationsAsync");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("report match tests", () => {
  it.each<keyof IQualification>(["blueTeam", "orangeTeam"])(
    "successfully reports match when %s reports",
    async (team) => {
      const mockReportingTeam = TeamBuilder.single();
      const mockMatch = QualMatchBuilder.single();
      const mockQual = QualBuilder.single({ [team]: mockReportingTeam._id, matches: [mockMatch] });

      mocked(TeamsAsync.getTeam).mockResolvedValueOnce(mockReportingTeam);
      mocked(QualificationsAsync.getMatches).mockResolvedValueOnce([mockQual]);
      const mockUpdateMatch = mocked(QualificationsAsync.updateMatchWithId);
      const [higherScore, lowerScore] = generateMatchScores();

      const response = await reportMatch(mockReportingTeam.players[0], higherScore, lowerScore);
      expect(response).toHaveProperty("title", "Match Reported");
      expect(mockUpdateMatch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          matches: expect.arrayContaining([
            expect.objectContaining({
              blueScore: team === "blueTeam" ? higherScore : lowerScore,
              orangeScore: team === "blueTeam" ? lowerScore : higherScore,
              reported: mockReportingTeam._id,
            }),
          ]),
        })
      );
    }
  );

  it("throws error when reporting team not found", async () => {
    mocked(TeamsAsync.getTeam).mockResolvedValueOnce(null);
    await expect(reportMatch(faker.random.uuid(), faker.random.number(10), faker.random.number(10))).rejects.toThrow();
  });

  it("gets the match with the latest round", async () => {
    const mockReportingTeam = TeamBuilder.single();
    const mockMatchConfirmed = QualMatchBuilder.single({ reported: mockReportingTeam._id, confirmed: true });
    const mockMatchUnconfirmed = QualMatchBuilder.single({ reported: null, confirmed: false });
    const mockQualRoundOne = QualBuilder.single({ round: 1, matches: [mockMatchConfirmed] });
    const mockQualRoundTwo = QualBuilder.single({ round: 2, matches: [mockMatchUnconfirmed] });

    mocked(TeamsAsync.getTeam).mockResolvedValueOnce(mockReportingTeam);
    mocked(QualificationsAsync.getMatches).mockResolvedValueOnce([mockQualRoundOne, mockQualRoundTwo]);
    const mockUpdateMatch = mocked(QualificationsAsync.updateMatchWithId);
    const [higherScore, lowerScore] = generateMatchScores();

    const response = await reportMatch(mockReportingTeam.players[0], higherScore, lowerScore);
    expect(response).toHaveProperty("title", "Match Reported");
    expect(mockUpdateMatch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        round: 2,
      })
    );
  });

  it("returns error message when previous match not confirmed", async () => {
    const mockReportingTeam = TeamBuilder.single();
    const mockMatch = QualMatchBuilder.single({ reported: mockReportingTeam._id, confirmed: false });
    const mockQual = QualBuilder.single({ matches: [mockMatch] });

    mocked(TeamsAsync.getTeam).mockResolvedValueOnce(mockReportingTeam);
    mocked(QualificationsAsync.getMatches).mockResolvedValueOnce([mockQual]);
    const mockUpdateMatch = mocked(QualificationsAsync.updateMatchWithId);
    const [higherScore, lowerScore] = generateMatchScores();

    const response = await reportMatch(mockReportingTeam.players[0], higherScore, lowerScore);
    expect(response).toHaveProperty("title", "Previous Match Not Confirmed");
    expect(mockUpdateMatch).not.toHaveBeenCalled();
  });

  it("updates the correct match", async () => {
    const mockReportingTeam = TeamBuilder.single();
    const mockMatches = QualMatchBuilder.many(2, {
      reported: mockReportingTeam._id,
      confirmed: true,
      blueScore: 0,
      orangeScore: 0,
    });
    mockMatches.push(QualMatchBuilder.single({ reported: null }));
    const mockQual = QualBuilder.single({ blueTeam: mockReportingTeam._id, matches: mockMatches });

    mocked(TeamsAsync.getTeam).mockResolvedValueOnce(mockReportingTeam);
    mocked(QualificationsAsync.getMatches).mockResolvedValueOnce([mockQual]);
    const mockUpdateMatch = mocked(QualificationsAsync.updateMatchWithId);
    const [higherScore, lowerScore] = generateMatchScores();

    const expectedMatchesUpdate: IMatch[] = [
      {
        reported: mockReportingTeam._id,
        blueScore: 0,
        orangeScore: 0,
        confirmed: true,
      },
      {
        reported: mockReportingTeam._id,
        blueScore: 0,
        orangeScore: 0,
        confirmed: true,
      },
      {
        reported: mockReportingTeam._id,
        blueScore: higherScore,
        orangeScore: lowerScore,
        confirmed: false,
      },
    ];

    const response = await reportMatch(mockReportingTeam.players[0], higherScore, lowerScore);
    expect(response).toHaveProperty("title", "Match Reported");
    expect(mockUpdateMatch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        matches: expect.arrayContaining(expectedMatchesUpdate),
      })
    );
  });

  it("returns error message when all games are reported", async () => {
    const mockReportingTeam = TeamBuilder.single();
    const mockMatch = QualMatchBuilder.single({ reported: mockReportingTeam._id, confirmed: true });
    const mockQual = QualBuilder.single({ matches: [mockMatch] });

    mocked(TeamsAsync.getTeam).mockResolvedValueOnce(mockReportingTeam);
    mocked(QualificationsAsync.getMatches).mockResolvedValueOnce([mockQual]);

    const response = await reportMatch(mockReportingTeam.players[0], faker.random.number(10), faker.random.number(10));
    expect(response).toHaveProperty("title", "No Matches to Report");
  });
});
