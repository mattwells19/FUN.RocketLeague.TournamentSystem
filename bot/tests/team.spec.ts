import { newTeam } from "../src/team";
import mockingoose from "mockingoose";
import Teams from "../Schemas/Teams";
import * as faker from "faker";
import { MessageEmbed } from "discord.js";
import { TeamBuilder } from "./Builders";
import * as TeamAsync from "../Schemas/TeamsAsync";
import { mocked } from "ts-jest/utils";

jest.mock("../Schemas/TeamsAsync");

beforeEach(() => {
  mockingoose.resetAll();
});

describe("team tests", () => {
  it("creates a new team correctly", async () => {
    mockingoose(Teams).toReturn(null, "findOne");
    const mockTeamName = faker.lorem.word();
    const response: MessageEmbed = await newTeam(mockTeamName, [
      faker.random.uuid(),
      faker.random.uuid(),
      faker.random.uuid(),
    ]);
    expect(response).toHaveProperty("title", "Team Registered");
    expect(response).toHaveProperty("description", expect.stringContaining(mockTeamName));
  });

  it("catches a player who is already registered", async () => {
    const mockDoc = TeamBuilder.single();
    // Returning anything results in the "Player already registered error"
    mocked(TeamAsync.getTeam).mockResolvedValueOnce(mockDoc);
    const response: MessageEmbed = await newTeam(faker.lorem.word(), mockDoc.players);
    expect(response).toHaveProperty("title", "Player Already Registered");
  });

  it("catches a team without a name", async () => {
    mockingoose(Teams).toReturn(null, "findOne");
    const response: MessageEmbed = await newTeam("", TeamBuilder.single().players);
    expect(response).toHaveProperty("title", "Error Registering Team");
    expect(response).toHaveProperty("description", "Team name required for registration.");
  });

  it.each<number>([1, 2, 4])("catches a team without 3 players", async (numOfPlayers) => {
    mockingoose(Teams).toReturn(null, "findOne");
    const teamIds = [];
    for (let i = 0; i < numOfPlayers; i++) teamIds.push(faker.random.uuid());
    const response: MessageEmbed = await newTeam(faker.lorem.word(), teamIds);
    expect(response).toHaveProperty("title", "Error Registering Team");
    expect(response).toHaveProperty("description", `Team must consist of 3 players, got ${numOfPlayers}`);
  });

  it("catches team with same name", async () => {
    const mockTeamName = faker.lorem.word();
    const mockTeams = TeamBuilder.many(2, { teamName: mockTeamName });
    mocked(TeamAsync.getTeam).mockResolvedValueOnce(null);
    mocked(TeamAsync.getTeam).mockResolvedValueOnce(null);
    mocked(TeamAsync.getTeam).mockResolvedValueOnce(null);
    mocked(TeamAsync.getTeam).mockResolvedValueOnce(mockTeams[1]);
    const response: MessageEmbed = await newTeam(mockTeamName, mockTeams[1].players);
    expect(response).toHaveProperty("title", "Team Name Taken");
  });
});
