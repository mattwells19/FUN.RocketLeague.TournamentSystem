import { Schema, model, Types } from "mongoose";
import { ModelAsync } from "./ModelAsync";

export interface IBestOfs {
  quals: number;
  quarters: number;
  semis: number;
  finals: number;
}

export interface ITournament {
  _id: Types.ObjectId;
  name: string;
  bestOfs: IBestOfs;
  numOfQualRounds: number;
  registration_open: boolean;
  startDateTime: Date;
}

const BestOfsSchema = new Schema({
  quals: {
    type: Number,
    default: -1,
  },
  quarters: {
    type: Number,
    default: -1,
  },
  semis: {
    type: Number,
    default: -1,
  },
  finals: {
    type: Number,
    default: -1,
  },
});

const TournamentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Tournament name required for registration."],
    },
    registration_open: {
      type: Boolean,
      default: false,
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    numOfQualRounds: {
      type: Number,
      default: -1,
    },
    bestOfs: BestOfsSchema,
  },
  { collection: "tournaments" }
);

const TournamentModel = model("Tournament", TournamentSchema);

export default new ModelAsync<ITournament>(TournamentModel);
