import { newTeam } from "../src/team";
import * as faker from "faker";
import { MessageEmbed } from "discord.js";
import { TeamBuilder } from "./Builders";
import Teams from "../Schemas/Teams";
import { mocked } from "ts-jest/utils";

jest.mock("../Schemas/Teams");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("team tests", () => {
  it("creates a new team correctly", async () => {
    mocked(Teams.getOne).mockResolvedValueOnce(null);
    const insertMock = mocked(Teams.insert).mockResolvedValueOnce(null);
    const mockTeamName = faker.lorem.word();
    const response: MessageEmbed = await newTeam(mockTeamName, [
      faker.random.uuid(),
      faker.random.uuid(),
      faker.random.uuid(),
    ]);
    expect(response).toHaveProperty("title", "Team Registered");
    expect(response).toHaveProperty("description", expect.stringContaining(mockTeamName));
    expect(insertMock).toHaveBeenCalled();
  });

  it("catches a player who is already registered", async () => {
    const mockDoc = TeamBuilder.single();
    // Returning anything results in the "Player already registered error"
    mocked(Teams.getOne).mockResolvedValue(mockDoc);
    const response: MessageEmbed = await newTeam(faker.lorem.word(), mockDoc.players);
    expect(response).toHaveProperty("title", "Player Already Registered");
  });

  // these tests check the validation logic built into the model which isn't defined when Teams is mocked
  it("catches a team without a name", async () => {
    const response: MessageEmbed = await newTeam("", TeamBuilder.single().players);
    expect(response).toHaveProperty("title", "Error Registering Team");
    expect(response).toHaveProperty("description", "You must provide a team name to register.");
  });

  it.each<number>([1, 2, 4])("catches a team without 3 players", async (numOfPlayers) => {
    mocked(Teams.getOne).mockResolvedValue(null);
    const teamIds = [];
    for (let i = 0; i < numOfPlayers; i++) teamIds.push(faker.random.uuid());
    const response: MessageEmbed = await newTeam(faker.lorem.word(), teamIds);
    expect(response).toHaveProperty("title", "Error Registering Team");
    expect(response).toHaveProperty("description", `You need 3 players to make a team. Found ${numOfPlayers}`);
  });

  it("catches team with same name", async () => {
    const mockTeamName = faker.lorem.word();
    const mockTeams = TeamBuilder.many(2, { teamName: mockTeamName });
    mocked(Teams.getOne).mockResolvedValueOnce(null);
    mocked(Teams.getOne).mockResolvedValueOnce(null);
    mocked(Teams.getOne).mockResolvedValueOnce(null);
    mocked(Teams.getOne).mockResolvedValueOnce(mockTeams[1]);
    const response: MessageEmbed = await newTeam(mockTeamName, mockTeams[1].players);
    expect(response).toHaveProperty("title", "Team Name Taken");
  });
});
