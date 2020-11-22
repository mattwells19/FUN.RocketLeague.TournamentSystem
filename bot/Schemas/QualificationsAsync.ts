import { Types, Document } from "mongoose";
import Qualifications, { IQualification } from "./Qualifications";

const convertAll = (docs: Document[]): IQualification[] => {
  return docs.map((d) => {
    const team = d.toJSON();
    return {
      _id: team._id,
      ...team,
    };
  });
};

export async function getMatches(teamId: Types.ObjectId): Promise<IQualification[]> {
  return convertAll(await Qualifications.find({ $or: [{ blueTeam: teamId }, { orangeTeam: teamId }] }));
}

export async function getAllMatches(): Promise<IQualification[]> {
  return convertAll(await Qualifications.find());
}

export async function addMatches(matches: IQualification[]): Promise<void> {
  await Qualifications.insertMany(matches);
}
