/* istanbul ignore file */

import { ITeam } from "../Schemas/Teams";
import * as faker from "faker";
import { Types } from "mongoose";

class BuildTeams {
  single(overrides?: Partial<ITeam>): ITeam {
    return {
      _id: Types.ObjectId(faker.random.uuid().substr(0, 12)),
      teamName: overrides?.teamName ?? faker.random.word(),
      players: overrides?.players ?? [faker.random.uuid(), faker.random.uuid(), faker.random.uuid()],
      seed: overrides?.seed ?? -1,
      wins: overrides?.wins ?? faker.random.number(),
      losses: overrides?.losses ?? faker.random.number(),
    } as ITeam;
  }

  many(count: number, overrides?: Partial<ITeam>): ITeam[] {
    const teams: ITeam[] = [];
    for (let i = 0; i < count; i++) {
      const newTeam = this.single(overrides);
      let confirmed = 0;
      while (confirmed < 3) {
        const foundPlayerDupeteam = teams.find((team) => team.players.includes(newTeam.players[confirmed]));
        if (foundPlayerDupeteam) {
          newTeam.players[i] = faker.random.uuid();
          confirmed = 0;
        } else confirmed++;
      }
      teams.push(newTeam);
    }
    return teams;
  }
}
const TeamBuilder = new BuildTeams();

export { TeamBuilder };
