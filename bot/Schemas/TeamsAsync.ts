import { MongooseFilterQuery, Document, Types, MongooseUpdateQuery } from "mongoose";
import Teams, { ITeam } from "./Teams";

export type QueryOptions = MongooseFilterQuery<Pick<Document, "_id">>;

const convertAll = (docs: Document[]): ITeam[] => {
  return docs.map((d) => {
    const team = d.toJSON();
    return {
      _id: team._id,
      teamName: team.teamName,
      channelId: team.channelId,
      seed: team.seed,
      wins: team.wins,
      losses: team.losses,
      players: team.players,
    };
  });
};

const convert = (doc: Document | null): ITeam | null => {
  if (!doc) return null;
  const team = doc.toJSON();
  return {
    _id: team._id,
    teamName: team.teamName,
    channelId: team.channelId,
    seed: team.seed,
    wins: team.wins,
    losses: team.losses,
    players: team.players,
  };
};

export async function getTeam(options: QueryOptions | undefined): Promise<ITeam | null> {
  return convert(await Teams.findOne(options));
}

export async function getTeamWithId(id: Types.ObjectId): Promise<ITeam | null> {
  return convert(await Teams.findById(id));
}

export async function getTeams(options: QueryOptions): Promise<ITeam[]> {
  return convertAll(await Teams.find(options));
}

export async function updateTeamById(id: Types.ObjectId, updates: Partial<ITeam>): Promise<ITeam | null> {
  return convert(await Teams.findByIdAndUpdate(id, updates, { new: true }));
}

export async function findAndUpdateTeam(options: QueryOptions, updates: Partial<ITeam>): Promise<ITeam | null> {
  return convert(await Teams.findOneAndUpdate(options, updates, { new: true }));
}

export async function findAndUpdateTeamWithId(
  id: Types.ObjectId,
  updates: Partial<ITeam> | MongooseUpdateQuery<Pick<Document, "_id">>
): Promise<ITeam | null> {
  return convert(await Teams.findByIdAndUpdate(id, updates, { new: true }));
}

export async function getNumberOfTeams(): Promise<number> {
  return await Teams.countDocuments();
}

export async function updateMultipleTeams(options: QueryOptions, updates: Partial<ITeam>): Promise<void> {
  await Teams.updateMany(options, updates, { new: true });
}
