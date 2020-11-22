import { getTeams } from "../Schemas/TeamsAsync";
import { getMatches } from "../Schemas/QualificationsAsync";
import { ITeam } from "../Schemas/Teams";
import { IQualification } from "../Schemas/Qualifications";

const getPotentialOpponents = async (team: ITeam, allTeams: ITeam[]): Promise<ITeam[]> => {
  const opponents = Array.from(allTeams);
  const matches = await getMatches(team._id);
  for (const match of matches) {
    if (team._id === match.blueTeam)
      opponents.splice(
        allTeams.findIndex((t) => t._id === match.orangeTeam),
        1
      );
    else
      opponents.splice(
        allTeams.findIndex((t) => t._id === match.blueTeam),
        1
      );
  }
  return opponents;
};

export default async function generateMatchups(): Promise<IQualification[]> {
  const matchups: IQualification[] = [];
  const teams = await getTeams({});
  const sortedTeams = teams.sort((a, b) => {
    const winDiff = a.wins - a.losses - (b.wins - b.losses);
    if (winDiff !== 0) return winDiff;
    else return a.seed - b.seed;
  });

  for (let i = 0; i < sortedTeams.length / 2; i++) {
    const team = sortedTeams[i];
    const potentialOpponents = await getPotentialOpponents(team, teams);
    const randomTeamSeed = Math.round(Math.random());
    const offset = Math.floor(potentialOpponents.length / 2);
    const opponent = potentialOpponents.length === 1 ? potentialOpponents[0] : sortedTeams[team.seed + offset - 1];
    matchups.push({
      matches: [{}],
      blueTeam: randomTeamSeed === 0 ? team._id : opponent._id,
      orangeTeam: randomTeamSeed === 0 ? opponent._id : team._id,
    } as IQualification);
  }
  return matchups;
}
