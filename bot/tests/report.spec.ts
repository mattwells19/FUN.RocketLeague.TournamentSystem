import { mocked } from "ts-jest/utils";
import { generateMatchScores, QualBuilder, QualMatchBuilder, TeamBuilder } from "./Builders";
import reportMatch from "../src/report";
import * as faker from "faker";
import { IMatch, IQualification } from "../Schemas/Qualifications";
import Teams from "../Schemas/Teams";
import Qualifications from "../Schemas/Qualifications";

jest.mock("../Schemas/Teams");
jest.mock("../Schemas/Qualifications");

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

      mocked(Teams.getOne).mockResolvedValueOnce(mockReportingTeam);
      mocked(Qualifications.get).mockResolvedValueOnce([mockQual]);
      const mockUpdateMatch = mocked(Qualifications.updateWithId);
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
    mocked(Teams.getOne).mockResolvedValueOnce(null);
    await expect(reportMatch(faker.random.uuid(), faker.random.number(10), faker.random.number(10))).rejects.toThrow();
  });

  it("gets the match with the latest round", async () => {
    const mockReportingTeam = TeamBuilder.single();
    const mockMatchConfirmed = QualMatchBuilder.single({ reported: mockReportingTeam._id, confirmed: true });
    const mockMatchUnconfirmed = QualMatchBuilder.single({ reported: null, confirmed: false });
    const mockQualRoundOne = QualBuilder.single({ round: 1, matches: [mockMatchConfirmed] });
    const mockQualRoundTwo = QualBuilder.single({ round: 2, matches: [mockMatchUnconfirmed] });

    mocked(Teams.getOne).mockResolvedValueOnce(mockReportingTeam);
    mocked(Qualifications.get).mockResolvedValueOnce([mockQualRoundOne, mockQualRoundTwo]);
    const mockUpdateMatch = mocked(Qualifications.updateWithId);
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

    mocked(Teams.getOne).mockResolvedValueOnce(mockReportingTeam);
    mocked(Qualifications.get).mockResolvedValueOnce([mockQual]);
    const mockUpdateMatch = mocked(Qualifications.updateWithId);
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

    mocked(Teams.getOne).mockResolvedValueOnce(mockReportingTeam);
    mocked(Qualifications.get).mockResolvedValueOnce([mockQual]);
    const mockUpdateMatch = mocked(Qualifications.updateWithId);
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

    mocked(Teams.getOne).mockResolvedValueOnce(mockReportingTeam);
    mocked(Qualifications.get).mockResolvedValueOnce([mockQual]);

    const response = await reportMatch(mockReportingTeam.players[0], faker.random.number(10), faker.random.number(10));
    expect(response).toHaveProperty("title", "No Matches to Report");
  });
});
