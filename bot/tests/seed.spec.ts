import * as Seed from "../src/seed";
import mockingoose from "mockingoose";
import * as faker from "faker";
import { MessageEmbed } from "discord.js";
import { TeamBuilder } from "./Builders";
import * as TeamsAsync from "../Schemas/TeamsAsync";
import { mocked } from "ts-jest/utils";
import { ITeam } from "../Schemas/Teams";

jest.mock("../Schemas/TeamsAsync");

beforeEach(() => {
  mockingoose.resetAll();
  jest.clearAllMocks();
});

describe("seed tests", () => {
  it("assigns a team a seed correctly", async () => {
    const mockTeams = TeamBuilder.many(8);
    mocked(TeamsAsync.getNumberOfTeams).mockResolvedValue(8);
    mocked(TeamsAsync.getTeam).mockResolvedValueOnce(mockTeams[0]);
    mocked(TeamsAsync.getTeam).mockResolvedValueOnce(null);
    mocked(TeamsAsync.updateTeamById).mockResolvedValueOnce(null);

    const mockSeed = faker.random.number(8);
    const response: MessageEmbed = await Seed.seedTeam(mockTeams[0].teamName, mockSeed);
    expect(response).toHaveProperty("title", "Team Seeded");
    expect(response).toHaveProperty("description", expect.stringContaining(mockSeed.toString()));
  });

  it("transfers seeds properly", async () => {
    const mockTeams = TeamBuilder.many(8);
    mockTeams[5].seed = 2;
    mocked(TeamsAsync.getNumberOfTeams).mockResolvedValue(8);
    mocked(TeamsAsync.getTeam).mockResolvedValueOnce(mockTeams[0]);
    mocked(TeamsAsync.getTeam).mockResolvedValueOnce(mockTeams[5]);
    const mockUpdate = mocked(TeamsAsync.updateTeamById);

    const response: MessageEmbed = await Seed.seedTeam(mockTeams[0].teamName, 2);
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
    mocked(TeamsAsync.getTeams).mockResolvedValue(mockTeams);

    const response: MessageEmbed = await Seed.getAllSeeds();
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
      mocked(TeamsAsync.getTeam).mockResolvedValue(mockTeam);

      const response: MessageEmbed = await Seed.getTeamSeed(mockTeam.teamName);
      expect(response).toHaveProperty("title", `${mockTeam.teamName}'s Seed`);

      if (seed === -1)
        expect(response).toHaveProperty("description", `**${mockTeam.teamName}** does not currently have a seed.`);
      else expect(response).toHaveProperty("description", `**${mockTeam.teamName}** is the **${mockTeam.seed}** seed.`);
    } else {
      mocked(TeamsAsync.getTeam).mockResolvedValue(mockTeam);
      const fakeTeamName = faker.random.word();
      const response: MessageEmbed = await Seed.getTeamSeed(fakeTeamName);
      expect(response).toHaveProperty("title", "Team Not Found");
      expect(response).toHaveProperty("description", `No team with the name **${fakeTeamName}** was found.`);
    }
  });

  it("rejects non-existant team", async () => {
    mocked(TeamsAsync.getNumberOfTeams).mockResolvedValue(8);
    mocked(TeamsAsync.getTeam).mockResolvedValue(null);
    const fakeTeamName = faker.random.word();
    const response: MessageEmbed = await Seed.seedTeam(fakeTeamName, faker.random.number(8));
    expect(response).toHaveProperty("title", "Team Not Found");
    expect(response).toHaveProperty("description", `No team with the name **${fakeTeamName}** was found.`);
  });

  it("rejects an invalid seed", async () => {
    mocked(TeamsAsync.getNumberOfTeams).mockResolvedValue(8);

    const fakeTeamName = faker.random.word();
    const response: MessageEmbed = await Seed.seedTeam(fakeTeamName, 9);
    expect(response).toHaveProperty("title", "Invalid Seed");
    expect(response).toHaveProperty("description", `There are only **${8}** teams. You can't have a **${9}** seed.`);
  });

  it("rejects an invalid seed NaN", async () => {
    const response: MessageEmbed = await Seed.seedTeam(faker.random.word(), NaN);
    expect(response).toHaveProperty("title", "Invalid Seed");
    expect(response).toHaveProperty("description", "Seed must be a number.");
  });

  it("automatically assigns seeds without dupes", async () => {
    const mockTeams = TeamBuilder.many(8);
    mocked(TeamsAsync.getNumberOfTeams).mockResolvedValue(8);
    mocked(TeamsAsync.getTeams).mockResolvedValueOnce(mockTeams);
    const seedsUsed = Array(8).fill(false);
    const mockUpdate = mocked(TeamsAsync.findAndUpdateTeam);

    await Seed.autoSeedTeams();
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
    const mockUpdate = mocked(TeamsAsync.updateMultipleTeams);

    await Seed.resetSeeds();
    expect(mockUpdate).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ seed: -1 }));
  });

  it("does not add footer when no seeds available", async () => {
    const mockTeams = TeamBuilder.many(8);
    mocked(TeamsAsync.getTeams).mockResolvedValue(mockTeams);
    mocked(TeamsAsync.getNumberOfTeams).mockResolvedValue(0);

    const response: MessageEmbed = await Seed.getAllSeeds();
    expect(response).toHaveProperty("title", "All Current Seeds");
    expect(response).toHaveProperty("footer", null);
  });
});
