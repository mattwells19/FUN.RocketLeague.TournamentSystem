import { mocked } from "ts-jest/utils";
import Teams from "../Schemas/Teams";
import Qualifications from "../Schemas/Qualifications";
import { generateMatchScores, QualBuilder, QualMatchBuilder, TeamBuilder } from "./Builders";
import * as faker from "faker";
import confirmCommand from "../src/confirm";
import { MessageEmbed } from "discord.js";
import { ICommandParameters } from "../src/Commands";

jest.mock("../Schemas/Teams");
jest.mock("../Schemas/Qualifications");

beforeEach(() => {
  jest.clearAllMocks();
});

async function runConfirmCommand(mockAuthorId: string = faker.random.uuid()): Promise<MessageEmbed> {
  return confirmCommand({ authorId: mockAuthorId } as ICommandParameters);
}

describe("confirm match tests", () => {
  it("throws error when confirming team not found", async () => {
    mocked(Teams.getOne).mockResolvedValueOnce(null);
    await expect(runConfirmCommand()).rejects.toThrow();
  });

  it.each([true, false])("returns error message when there is no match to confirm", async (confirmed) => {
    const mockConfirmingTeam = TeamBuilder.single();
    const mockMatch = QualMatchBuilder.single({ reported: confirmed ? undefined : null, confirmed });
    const mockQual = QualBuilder.single({ blueTeam: mockConfirmingTeam._id, matches: [mockMatch] });

    mocked(Teams.getOne).mockResolvedValueOnce(mockConfirmingTeam);
    mocked(Qualifications.get).mockResolvedValueOnce([mockQual]);
    const response = await runConfirmCommand(mockConfirmingTeam.players[0]);
    expect(response).toHaveProperty("title", "No Matches Reported");
  });

  it("stops the reporting team from confirming the match", async () => {
    const mockConfirmingTeam = TeamBuilder.single();
    const mockMatch = QualMatchBuilder.single({ reported: mockConfirmingTeam._id, confirmed: false });
    const mockQual = QualBuilder.single({ blueTeam: mockConfirmingTeam._id, matches: [mockMatch] });

    mocked(Teams.getOne).mockResolvedValueOnce(mockConfirmingTeam);
    mocked(Qualifications.get).mockResolvedValueOnce([mockQual]);
    const response = await runConfirmCommand(mockConfirmingTeam.players[0]);
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

    mocked(Teams.getOne).mockResolvedValueOnce(mockConfirmingTeam);
    mocked(Qualifications.get).mockResolvedValueOnce([mockQual]);
    const mockUpdateMatch = mocked(Qualifications.updateWithId);
    // const mockFindAndUpdateTeamWithId = mocked(Teams.findAndUpdateTeamWithId);
    const response = await runConfirmCommand(mockConfirmingTeam.players[0]);
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
