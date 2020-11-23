import { getTeams } from "../Schemas/TeamsAsync";
import { ITeam } from "../Schemas/Teams";
import { IQualification } from "../Schemas/Qualifications";

const groupByRecord = (allTeams: ITeam[]): Map<number, Array<ITeam>> => {
  const allWinLosses = Array.from(new Set(allTeams.map((team) => team.wins - team.losses)));
  const winLossMap = new Map<number, Array<ITeam>>();
  allWinLosses.forEach((winLoss) => {
    winLossMap.set(
      winLoss,
      allTeams.filter((team) => winLoss === team.wins - team.losses)
    );
  });
  return winLossMap;
};

export default async function generateMatchups(): Promise<IQualification[]> {
  const matchups: IQualification[] = [];
  const teams = await getTeams({});
  const teamGroups = groupByRecord(teams);
  teamGroups.forEach((teams) => {
    const firstHalf = teams.splice(0, Math.floor(teams.length / 2));
    const secondHalf = [...teams];
    for (let i = 0; i < firstHalf.length; i++) {
      const randomTeamSeed = Math.round(Math.random());
      matchups.push({
        matches: [{}],
        blueTeam: randomTeamSeed === 0 ? firstHalf[i]._id : secondHalf[i]._id,
        orangeTeam: randomTeamSeed === 0 ? secondHalf[i]._id : firstHalf[i]._id,
      } as IQualification);
    }
  });
  return matchups;
}
