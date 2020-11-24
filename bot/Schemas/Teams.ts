import { Schema, model, Types } from "mongoose";
import { ModelAsync } from "./ModelAsync";

export interface ITeam {
  _id: Types.ObjectId;
  teamName: string;
  channelId: string;
  players: string[];
  seed: number;
  wins: number;
  losses: number;
}

const TeamSchema = new Schema(
  {
    teamName: {
      type: String,
      required: [true, "Team name required for registration."],
    },
    players: {
      type: [String],
      required: true,
    },
    channelId: String,
    seed: Number,
    wins: Number,
    losses: Number,
  },
  { collection: "teams" }
);

const TeamsModel = model("Team", TeamSchema);

export default new ModelAsync<ITeam>(TeamsModel);
