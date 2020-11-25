import { MessageEmbed } from "discord.js";
import { ErrorEmbed, InfoEmbed, SuccessEmbed } from "./EmbedHelper";
import Tournaments from "../Schemas/Tournaments";
import { CommandFunctionType } from "./Commands";

const tournamentCommand: CommandFunctionType = async ({ args }) => {
  if (args.length === 0) {
    return await listTournaments();
  } else if (args.includes("delete")) {
    const tournamentName = args.filter((value) => value !== "delete").join(" ");
    return await deleteTournament(tournamentName);
  } else {
    const tournamentDate = args.pop() ?? "";
    const tournamentName = args.join(" ").trim();
    return await newTournament(tournamentName, tournamentDate);
  }
};
export default tournamentCommand;

const formateDateTime = (dateTime: string): Date | null => {
  // expected format: Month/Day/Year-Hour:Minute[pm/am]
  try {
    const [date, time] = dateTime.split("-");
    const [month, day, year] = date.split("/");
    const [hour, minute] = time.split(":");
    const timeArea = minute.slice(2, 4).toLowerCase();

    let hourOffset = 0;
    if (timeArea === "pm") hourOffset = 12;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour) + hourOffset, parseInt(minute));
  } catch {
    return null;
  }
};

async function newTournament(name: string, date: string): Promise<MessageEmbed> {
  if (name === "") return ErrorEmbed("Tournament Not Created", "You must provide a name for your tournament.");

  if (await Tournaments.getOne({ name: new RegExp(`^${name}$`, "i") }))
    return ErrorEmbed(
      "Tournament Not Created",
      `You must provide a unique name for your tournament. There is already a tournament named ${name}.`
    );

  const formattedDate = formateDateTime(date);
  if (!formattedDate)
    return ErrorEmbed(
      "Invalid Date Format",
      "Please provide a start date and time in the following format: `Month/Day/Year-Hour:Minute[pm/am]`"
    );
  else {
    await Tournaments.insert({
      name,
      startDateTime: formattedDate,
      bestOfs: {
        quals: -1,
        quarters: -1,
        semis: -1,
        finals: -1,
      },
    });
    return SuccessEmbed(
      `${name} Created`,
      `Tournament created with a start date of: ${formattedDate.toLocaleString()}.`
    );
  }
}

async function listTournaments(): Promise<MessageEmbed> {
  const tournaments = await Tournaments.get({ startDateTime: { $gt: new Date() } });
  const message = InfoEmbed("Tournaments", "");
  tournaments.forEach((tournament) => {
    message.addField(tournament.name, tournament.startDateTime.toLocaleString());
  });
  return message;
}

async function deleteTournament(name: string): Promise<MessageEmbed> {
  const removedTournament = await Tournaments.remove({ name });
  if (removedTournament) return SuccessEmbed(`Removed ${name}`, "Successfully removed tournament.");
  else
    return ErrorEmbed(
      "Tournament Not Found",
      `No tournament with the name **${name}** was not found. Run \`-tournament\` to see a list of all tournaments.`
    );
}
