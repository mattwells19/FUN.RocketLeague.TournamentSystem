/* istanbul ignore file */

import { ITeam } from "../Schemas/Teams";
import * as faker from "faker";
import { Types } from "mongoose";
import { IMatch, IQualification } from "../Schemas/Qualifications";

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

class BuildQuals {
  single(overrides?: Partial<IQualification>): IQualification {
    return {
      _id: overrides?._id ?? Types.ObjectId(faker.random.uuid().substr(0, 12)),
      blueTeam: overrides?.blueTeam ?? Types.ObjectId(faker.random.uuid().substr(0, 12)),
      orangeTeam: overrides?.orangeTeam ?? Types.ObjectId(faker.random.uuid().substr(0, 12)),
      matches: overrides?.matches ?? [],
      round: overrides?.round ?? faker.random.number(10),
      seriesWinner: overrides?.seriesWinner ?? null,
    } as IQualification;
  }

  many(count: number, overrides?: Partial<IQualification>): IQualification[] {
    const quals: IQualification[] = [];
    for (let i = 0; i < count; i++) {
      const newQual = this.single(overrides);
      quals.push(newQual);
    }
    return quals;
  }
}
const QualBuilder = new BuildQuals();

class BuildQualMatches {
  single(overrides?: Partial<IMatch>): IMatch {
    return {
      blueScore: overrides?.blueScore ?? faker.random.number(10),
      orangeScore: overrides?.orangeScore ?? faker.random.number(10),
      confirmed: overrides?.confirmed ?? false,
      reported: overrides?.reported ?? null,
    } as IMatch;
  }

  many(count: number, overrides?: Partial<IMatch>): IMatch[] {
    const quals: IMatch[] = [];
    for (let i = 0; i < count; i++) {
      const newQual = this.single(overrides);
      quals.push(newQual);
    }
    return quals;
  }
}
const QualMatchBuilder = new BuildQualMatches();

export { TeamBuilder, QualBuilder, QualMatchBuilder };
