import { mocked } from "ts-jest/utils";
import * as TeamsAsync from "../Schemas/TeamsAsync";
import * as QualificationsAsync from "../Schemas/QualificationsAsync";
import { generateMatchScores, QualBuilder, QualMatchBuilder, TeamBuilder } from "./Builders";
import reportMatch from "../src/report";
import * as faker from "faker";
import confirmMatch from "../src/confirm";

jest.mock("../Schemas/TeamsAsync");
jest.mock("../Schemas/QualificationsAsync");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("confirm match tests", () => {
  it("throws error when confirming team not found", async () => {
    mocked(TeamsAsync.getTeam).mockResolvedValueOnce(null);
    await expect(reportMatch(faker.random.uuid(), faker.random.number(10), faker.random.number(10))).rejects.toThrow();
  });

  it.each([true, false])("returns error message when there is no match to confirm", async (confirmed) => {
    const mockConfirmingTeam = TeamBuilder.single();
    const mockMatch = QualMatchBuilder.single({ reported: confirmed ? undefined : null, confirmed });
    const mockQual = QualBuilder.single({ blueTeam: mockConfirmingTeam._id, matches: [mockMatch] });

    mocked(TeamsAsync.getTeam).mockResolvedValueOnce(mockConfirmingTeam);
    mocked(QualificationsAsync.getMatches).mockResolvedValueOnce([mockQual]);
    const response = await confirmMatch(mockConfirmingTeam.players[0]);
    expect(response).toHaveProperty("title", "No Matches Reported");
  });

  it("stops the reporting team from confirming the match", async () => {
    const mockConfirmingTeam = TeamBuilder.single();
    const mockMatch = QualMatchBuilder.single({ reported: mockConfirmingTeam._id, confirmed: false });
    const mockQual = QualBuilder.single({ blueTeam: mockConfirmingTeam._id, matches: [mockMatch] });

    mocked(TeamsAsync.getTeam).mockResolvedValueOnce(mockConfirmingTeam);
    mocked(QualificationsAsync.getMatches).mockResolvedValueOnce([mockQual]);
    const response = await confirmMatch(mockConfirmingTeam.players[0]);
    expect(response).toHaveProperty("title", "Cannot Confirm Match");
  });

  it("confirms the match", async () => {
    const mockReportingTeam = TeamBuilder.single();
    const mockConfirmingTeam = TeamBuilder.single();
    const [higherScore, lowerScore] = generateMatchScores();
    const mockMatch = QualMatchBuilder.many(2, {
      blueScore: lowerScore,
      orangeScore: higherScore,
      reported: mockConfirmingTeam._id,
      confirmed: true,
    });
    const mockMatchTwo = QualMatchBuilder.single({
      blueScore: higherScore,
      orangeScore: lowerScore,
      reported: mockReportingTeam._id,
      confirmed: false,
    });
    const mockQual = QualBuilder.single({
      blueTeam: mockReportingTeam._id,
      orangeTeam: mockConfirmingTeam._id,
      matches: [...mockMatch, mockMatchTwo],
    });

    mocked(TeamsAsync.getTeam).mockResolvedValueOnce(mockConfirmingTeam);
    mocked(QualificationsAsync.getMatches).mockResolvedValueOnce([mockQual]);
    const mockUpdateMatch = mocked(QualificationsAsync.updateMatchWithId);
    // const mockFindAndUpdateTeamWithId = mocked(TeamsAsync.findAndUpdateTeamWithId);
    const response = await confirmMatch(mockConfirmingTeam.players[0]);
    expect(response).toHaveProperty("title", "Match Confirmed");
    expect(mockUpdateMatch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        matches: expect.arrayContaining([
          expect.objectContaining({
            reported: mockReportingTeam._id,
            confirmed: true,
          }),
        ]),
      })
    );
    // expect(mockFindAndUpdateTeamWithId).toHaveBeenCalledTimes(2);
    // expect(mockFindAndUpdateTeamWithId).toHaveBeenCalledWith(
    //   mockConfirmingTeam._id,
    //   expect.objectContaining({ $inc: { wins: 1 } })
    // );
    // expect(mockFindAndUpdateTeamWithId).toHaveBeenCalledWith(
    //   mockReportingTeam._id,
    //   expect.objectContaining({ $inc: { losses: 1 } })
    // );
  });

  it.todo("account for isEndOfSeries flag");
});
