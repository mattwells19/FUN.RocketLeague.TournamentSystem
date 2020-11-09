import { Schema, model } from "mongoose";

export interface ITeam {
  teamName: string;
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
      validate: {
        validator: (player_ids: string[]) => player_ids.length === 3,
        message: (props) => `Team must consist of 3 players, got ${props.value.length}`,
      },
    },
    seed: Number,
    wins: Number,
    losses: Number,
  },
  { collection: "teams" }
);

export default model("Team", TeamSchema);
