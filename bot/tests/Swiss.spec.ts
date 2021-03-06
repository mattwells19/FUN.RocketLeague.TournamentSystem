import { mocked } from "ts-jest/utils";
import generateMatchups from "../src/Swiss";
import { TeamBuilder } from "./Builders";
import { IQualification } from "../Schemas/Qualifications";
import { mockRandom } from "jest-mock-random";
import Teams from "../Schemas/Teams";
import Qualifications from "../Schemas/Qualifications";

jest.mock("../Schemas/Teams");
jest.mock("../Schemas/Qualifications");

describe("Swiss tests", () => {
  it("generates first round correctly - even number of teams", async () => {
    mockRandom(0.0);
    const mockTeams = TeamBuilder.many(8, { wins: 0, losses: 0 }).map((team, i) => ({ ...team, seed: i + 1 }));
    mocked(Teams.get).mockResolvedValue(mockTeams);
    mocked(Qualifications.get).mockResolvedValue([]);
    const response: IQualification[] = await generateMatchups();

    expect(response[0].blueTeam).toBe(mockTeams[0]._id);
    expect(response[1].blueTeam).toBe(mockTeams[1]._id);
    expect(response[2].blueTeam).toBe(mockTeams[2]._id);
    expect(response[3].blueTeam).toBe(mockTeams[3]._id);

    expect(response[0].orangeTeam).toBe(mockTeams[4]._id);
    expect(response[1].orangeTeam).toBe(mockTeams[5]._id);
    expect(response[2].orangeTeam).toBe(mockTeams[6]._id);
    expect(response[3].orangeTeam).toBe(mockTeams[7]._id);
  });

  it("generates first round correctly - odd number of teams", async () => {
    mockRandom(0.0);
    const mockTeams = TeamBuilder.many(7, { wins: 0, losses: 0 }).map((team, i) => ({ ...team, seed: i + 1 }));
    mocked(Teams.get).mockResolvedValue(mockTeams);
    mocked(Qualifications.get).mockResolvedValue([]);
    const response: IQualification[] = await generateMatchups();

    expect(response[0].blueTeam).toBe(mockTeams[0]._id);
    expect(response[1].blueTeam).toBe(mockTeams[1]._id);
    expect(response[2].blueTeam).toBe(mockTeams[2]._id);

    expect(response[0].orangeTeam).toBe(mockTeams[3]._id);
    expect(response[1].orangeTeam).toBe(mockTeams[4]._id);
    expect(response[2].orangeTeam).toBe(mockTeams[5]._id);
  });
});
