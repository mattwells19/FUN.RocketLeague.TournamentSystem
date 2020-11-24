import { MessageEmbed } from "discord.js";
import { ErrorEmbed, SuccessEmbed } from "./EmbedHelper";
import Teams, { ITeam } from "../Schemas/Teams";

const sortTeamsBySeed = (a: ITeam, b: ITeam): number => {
  // Unseeded teams should show below seeded teams
  // Otherwise sort like normal
  if (a.seed === -1) return 1;
  else if (b.seed === -1) return -1;
  else return a.seed - b.seed;
};

const getAvailableSeeds = async (): Promise<number[]> => {
  const numberOfTeams: number = await Teams.count();
  const seededDocs = await Teams.get({ seed: { $ne: -1 } });
  const seedsTaken: number[] = seededDocs.map((team) => team.seed);

  return Array.from(Array(numberOfTeams).keys())
    .map((x) => x + 1) // add one since it starts at 0
    .filter((x) => !seedsTaken.includes(x)); // fiter out the seeds already taken
};

export async function seedTeam(teamName: string, seed: number): Promise<MessageEmbed> {
  if (isNaN(seed)) return ErrorEmbed("Invalid Seed", "Seed must be a number.");

  // Validate seed is less than the number of teams
  const numberOfTeams: number = await Teams.count();
  if (seed > numberOfTeams)
    return ErrorEmbed("Invalid Seed", `There are only **${numberOfTeams}** teams. You can't have a **${seed}** seed.`);

  // Validate team exists
  const team = await Teams.getOne({ teamName: new RegExp(`^${teamName}$`, "i") });
  if (!team) return ErrorEmbed("Team Not Found", `No team with the name **${teamName}** was found.`);

  const seedTaken = await Teams.getOne({ seed });
  if (seedTaken) await Teams.updateWithId(seedTaken._id, { seed: -1 });

  // Update doc with seed
  await Teams.updateWithId(team._id, { seed });

  return seedTaken
    ? SuccessEmbed(
        "Seed Transfered",
        `**${team.teamName}** has been given the **${seed}** seed and **${seedTaken.teamName}**'s seed has been reset.`
      )
    : SuccessEmbed("Team Seeded", `**${team.teamName}** has been given the **${seed}** seed.`);
}

export async function autoSeedTeams(): Promise<MessageEmbed> {
  const availableSeeds: number[] = await getAvailableSeeds();
  const updatedTeams: ITeam[] = [];
  const numberOfTeamsToSeed: number = availableSeeds.length;

  for (let i = 0; i < numberOfTeamsToSeed; i++) {
    const randomSeedIndex: number = Math.floor(Math.random() * availableSeeds.length);
    const randomSeed: number = availableSeeds.splice(randomSeedIndex, 1)[0];
    const updatedTeam = await Teams.updateOne({ seed: -1 }, { seed: randomSeed });
    if (updatedTeam) updatedTeams.push(updatedTeam);
  }

  return await getAllSeeds();
}

export async function resetSeeds(): Promise<MessageEmbed> {
  await Teams.update({}, { seed: -1 });
  return SuccessEmbed("Seeds Reset", "All seeds have been reset.");
}

export async function getTeamSeed(teamName: string): Promise<MessageEmbed> {
  const team = await Teams.getOne({ teamName: new RegExp(`^${teamName}$`, "i") });
  if (team) {
    const seed: number = team.seed;
    if (seed === -1)
      return SuccessEmbed(`${team.teamName}'s Seed`, `**${team.teamName}** does not currently have a seed.`);
    else return SuccessEmbed(`${team.teamName}'s Seed`, `**${team.teamName}** is the **${team.seed}** seed.`);
  } else return ErrorEmbed("Team Not Found", `No team with the name **${teamName}** was found.`);
}

export async function getAllSeeds(): Promise<MessageEmbed> {
  const teams: ITeam[] = await Teams.get({});

  let teamMessage = "";
  teams.sort(sortTeamsBySeed).forEach((team) => {
    const seed = team.seed === -1 ? "[Unseeded]" : team.seed;
    teamMessage += `${seed} - ${team.teamName}\n\n`;
  });
  const availableSeeds: number[] = await getAvailableSeeds();
  const responseEmbed = SuccessEmbed("All Current Seeds", teamMessage);

  return availableSeeds.length > 0
    ? responseEmbed.setFooter("Available Seeds: " + availableSeeds.join(", "))
    : responseEmbed;
}
