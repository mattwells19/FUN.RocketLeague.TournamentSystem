import { Schema, model, Types } from "mongoose";

export interface IMatch {
  blueScore: number;
  orangeScore: number;
  reported: Types.ObjectId | null;
  confirmed: boolean;
}

export interface IQualification {
  _id: Types.ObjectId;
  blueTeam: Types.ObjectId;
  orangeTeam: Types.ObjectId;
  round: number;
  matches: IMatch[];
  seriesWinner: Types.ObjectId | null;
}

const MatchesSchema = new Schema({
  blueScore: {
    type: Number,
    default: -1,
  },
  orangeScore: {
    type: Number,
    default: -1,
  },
  reported: {
    type: Types.ObjectId,
    default: null,
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
});

const QualificationsSchema = new Schema(
  {
    blueTeam: {
      type: Types.ObjectId,
      required: true,
    },
    orangeTeam: {
      type: Types.ObjectId,
      required: true,
    },
    matches: [MatchesSchema],
    round: {
      type: Number,
      required: true,
    },
    seriesWinner: {
      type: Types.ObjectId,
      default: null,
    },
  },
  { collection: "qualifications" }
);

export default model("Qualifications", QualificationsSchema);
