import { newTeam } from "./team";
import mockingoose from "mockingoose";
import Teams, { ITeam } from "./Schemas/Teams";
import * as faker from "faker";
import { MessageEmbed } from "discord.js";

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
    const mockDoc: ITeam = {
      teamName: faker.random.word(),
      players: [faker.random.uuid(), faker.random.uuid(), faker.random.uuid()],
      seed: faker.random.number(),
      wins: faker.random.number(),
      losses: faker.random.number(),
    };
    // Returning anything results in the "Player already registered error"
    mockingoose(Teams).toReturn(mockDoc, "findOne");
    const response: MessageEmbed = await newTeam(faker.lorem.word(), [
      faker.random.uuid(),
      faker.random.uuid(),
      faker.random.uuid(),
    ]);
    expect(response).toHaveProperty("title", "Player Already Registered");
  });

  it("catches a team without a name", async () => {
    mockingoose(Teams).toReturn(null, "findOne");
    const response: MessageEmbed = await newTeam("", [faker.random.uuid(), faker.random.uuid(), faker.random.uuid()]);
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

  it("catches error on mongoose call", async () => {
    mockingoose(Teams).toReturn(new Error("Test Error"), "findOne");
    const response: MessageEmbed = await newTeam(faker.lorem.word(), [
      faker.random.uuid(),
      faker.random.uuid(),
      faker.random.uuid(),
    ]);
    expect(response).toHaveProperty("title", "Error Registering Team");
    expect(response).toHaveProperty("description", "The server responded with Test Error.");
  });
});
