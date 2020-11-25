import seedCommand from "../src/seed";
import mockingoose from "mockingoose";
import * as faker from "faker";
import { MessageEmbed } from "discord.js";
import { TeamBuilder } from "./Builders";
import Teams from "../Schemas/Teams";
import { mocked } from "ts-jest/utils";
import { ITeam } from "../Schemas/Teams";
import { ICommandParameters } from "../src/Commands";

jest.mock("../Schemas/Teams");

beforeEach(() => {
  mockingoose.resetAll();
  jest.clearAllMocks();
});

async function runSeedCommand(args: string[]): Promise<MessageEmbed> {
  return await seedCommand({ args } as ICommandParameters);
}

describe("seed tests", () => {
  it("assigns a team a seed correctly", async () => {
    const mockTeams = TeamBuilder.many(8);
    mocked(Teams.count).mockResolvedValue(8);
    mocked(Teams.getOne).mockResolvedValueOnce(mockTeams[0]);
    mocked(Teams.getOne).mockResolvedValueOnce(null);
    mocked(Teams.updateWithId).mockResolvedValueOnce(null);

    const mockSeed = faker.random.number({ min: 1, max: 8 });
    const response: MessageEmbed = await runSeedCommand([mockTeams[0].teamName, mockSeed.toString()]);
    expect(response).toHaveProperty("title", "Team Seeded");
    expect(response).toHaveProperty("description", expect.stringContaining(mockSeed.toString()));
  });

  it("assigns a team seed of -1 if given 0", async () => {
    const mockTeams = TeamBuilder.many(8);
    mocked(Teams.count).mockResolvedValue(8);
    mocked(Teams.getOne).mockResolvedValueOnce(mockTeams[0]);
    mocked(Teams.getOne).mockResolvedValueOnce(null);
    mocked(Teams.updateWithId).mockResolvedValueOnce(null);

    const response: MessageEmbed = await runSeedCommand([mockTeams[0].teamName, "0"]);
    expect(response).toHaveProperty("title", "Team Seeded");
    expect(response).toHaveProperty("description", expect.stringContaining("-1"));
  });

  it("transfers seeds properly", async () => {
    const mockTeams = TeamBuilder.many(8);
    mockTeams[5].seed = 2;
    mocked(Teams.count).mockResolvedValue(8);
    mocked(Teams.getOne).mockResolvedValueOnce(mockTeams[0]);
    mocked(Teams.getOne).mockResolvedValueOnce(mockTeams[5]);
    const mockUpdate = mocked(Teams.updateWithId);

    const response: MessageEmbed = await runSeedCommand([mockTeams[0].teamName, "2"]);
    expect(mockUpdate).toBeCalledTimes(2);
    expect(mockUpdate).nthCalledWith(1, mockTeams[5]._id, expect.objectContaining({ seed: -1 }));
    expect(mockUpdate).toHaveBeenLastCalledWith(mockTeams[0]._id, expect.objectContaining({ seed: 2 }));

    expect(response).toHaveProperty("title", "Seed Transfered");
    expect(response).toHaveProperty(
      "description",
      `**${mockTeams[0].teamName}** has been given the **2** seed and **${mockTeams[5].teamName}**'s seed has been reset.`
    );
  });

  it("gets all seeds", async () => {
    const mockTeams = TeamBuilder.many(8);
    mockTeams[4].seed = 2;
    mockTeams[2].seed = 8;
    mocked(Teams.get).mockResolvedValue(mockTeams);

    const response: MessageEmbed = await runSeedCommand([]);
    expect(response).toHaveProperty("title", "All Current Seeds");
    mockTeams.forEach((team) => {
      expect(response).toHaveProperty(
        "description",
        expect.stringContaining(`${team.seed === -1 ? "[Unseeded]" : team.seed} - ${team.teamName}`)
      );
    });
    expect(response).toHaveProperty("footer", expect.objectContaining({ text: "Available Seeds: 1, 3, 4, 5, 6, 7" }));
  });

  it.each<[ITeam | null, number]>([
    [TeamBuilder.single(), -1],
    [TeamBuilder.single(), faker.random.number(8)],
    [null, -1],
  ])("gets specific team's seed", async (mockTeam, seed) => {
    if (mockTeam) {
      mockTeam.seed = seed;
      mocked(Teams.getOne).mockResolvedValue(mockTeam);

      const response: MessageEmbed = await runSeedCommand([mockTeam.teamName]);
      expect(response).toHaveProperty("title", `${mockTeam.teamName}'s Seed`);

      if (seed === -1)
        expect(response).toHaveProperty("description", `**${mockTeam.teamName}** does not currently have a seed.`);
      else expect(response).toHaveProperty("description", `**${mockTeam.teamName}** is the **${mockTeam.seed}** seed.`);
    } else {
      mocked(Teams.getOne).mockResolvedValue(mockTeam);
      const fakeTeamName = faker.random.word();
      const response: MessageEmbed = await runSeedCommand([fakeTeamName]);
      expect(response).toHaveProperty("title", "Team Not Found");
      expect(response).toHaveProperty("description", `No team with the name **${fakeTeamName}** was found.`);
    }
  });

  it("rejects non-existant team", async () => {
    mocked(Teams.count).mockResolvedValue(8);
    mocked(Teams.getOne).mockResolvedValue(null);
    const fakeTeamName = faker.random.word();
    const response: MessageEmbed = await runSeedCommand([fakeTeamName, faker.random.number(8).toString()]);
    expect(response).toHaveProperty("title", "Team Not Found");
    expect(response).toHaveProperty("description", `No team with the name **${fakeTeamName}** was found.`);
  });

  it("rejects an invalid seed", async () => {
    mocked(Teams.count).mockResolvedValue(8);

    const fakeTeamName = faker.random.word();
    const response: MessageEmbed = await runSeedCommand([fakeTeamName, "9"]);
    expect(response).toHaveProperty("title", "Invalid Seed");
    expect(response).toHaveProperty("description", `There are only **${8}** teams. You can't have a **${9}** seed.`);
  });

  it("automatically assigns seeds without dupes", async () => {
    const mockTeams = TeamBuilder.many(8);
    mocked(Teams.count).mockResolvedValue(8);
    mocked(Teams.get).mockResolvedValueOnce(mockTeams);
    const seedsUsed = Array(8).fill(false);
    const mockUpdate = mocked(Teams.updateOne);

    await runSeedCommand(["auto"]);
    expect(mockUpdate).toHaveBeenCalledTimes(8);
    for (let i = 0; i < 8; i++) {
      const seed: number = mockUpdate.mock.calls[i][1].seed ?? -1;
      expect(seed).not.toBe(-1);
      const seedIndex = seed - 1;
      expect(seedsUsed[seedIndex]).toBeFalsy();
      seedsUsed[seedIndex] = true;
    }
  });

  it("updates all team's seeds to -1", async () => {
    const mockUpdate = mocked(Teams.update);

    await runSeedCommand(["reset"]);
    expect(mockUpdate).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ seed: -1 }));
  });

  it("does not add footer when no seeds available", async () => {
    const mockTeams = TeamBuilder.many(8);
    mocked(Teams.get).mockResolvedValue(mockTeams);
    mocked(Teams.count).mockResolvedValue(0);

    const response: MessageEmbed = await runSeedCommand([]);
    expect(response).toHaveProperty("title", "All Current Seeds");
    expect(response).toHaveProperty("footer", null);
  });
});
