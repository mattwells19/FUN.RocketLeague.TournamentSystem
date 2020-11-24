import { mocked } from "ts-jest/utils";
import Tournaments from "../Schemas/Tournaments";
import { deleteTournament, listTournaments, newTournament } from "../src/tournament";
import * as faker from "faker";
import { TournamentBuilder } from "./Builders";

jest.mock("../Schemas/Tournaments");

beforeEach(() => {
  jest.clearAllMocks();
});

const generateFakeDateString = () => {
  const date = `${faker.random.number({ max: 12, min: 1 })}/${faker.random.number({
    max: 30,
    min: 1,
  })}/${faker.random.number({ max: 2030, min: 2021 })}`;
  const time = `${faker.random.number({ max: 12, min: 1 })}:${faker.random.number({
    max: 59,
    min: 0,
  })}${faker.random.arrayElement(["am", "pm"])}`;
  return date + "-" + time;
};

describe("tournament tests", () => {
  it("returns error message with no team name", async () => {
    const reponse = await newTournament("", generateFakeDateString());
    expect(reponse).toHaveProperty("title", "Tournament Not Created");
    expect(reponse).toHaveProperty("description", "You must provide a name for your tournament.");
  });

  it("returns error message dupe team name", async () => {
    mocked(Tournaments.getOne).mockResolvedValueOnce(TournamentBuilder.single());
    const mockName = faker.random.words();
    const reponse = await newTournament(mockName, generateFakeDateString());
    expect(reponse).toHaveProperty("title", "Tournament Not Created");
    expect(reponse).toHaveProperty(
      "description",
      `You must provide a unique name for your tournament. There is already a tournament named ${mockName}.`
    );
  });

  it("returns error message on invalid date string", async () => {
    mocked(Tournaments.getOne).mockResolvedValueOnce(null);
    const reponse = await newTournament(faker.random.words(), faker.lorem.word());
    expect(reponse).toHaveProperty("title", "Invalid Date Format");
  });

  it.each([
    ["10/10/2030-8:30pm", new Date(2030, 9, 10, 20, 30, 0, 0).toLocaleString()],
    ["10/10/2030-8:30am", new Date(2030, 9, 10, 8, 30, 0, 0).toLocaleString()],
  ])("creates new tournament correctly", async (dateString, expectedFormattedDateString) => {
    mocked(Tournaments.getOne).mockResolvedValueOnce(null);
    const mockAddTournament = mocked(Tournaments.insert).mockResolvedValue(null);
    const mockName = faker.random.words();
    const reponse = await newTournament(mockName, dateString);
    expect(reponse).toHaveProperty("title", `${mockName} Created`);
    expect(reponse).toHaveProperty(
      "description",
      `Tournament created with a start date of: ${expectedFormattedDateString}.`
    );
    expect(mockAddTournament).toHaveBeenCalledWith(expect.objectContaining({ name: mockName }));
  });

  it("lists all tournaments", async () => {
    const mockTournaments = TournamentBuilder.many(3);
    mocked(Tournaments.get).mockResolvedValueOnce(mockTournaments);
    const response = await listTournaments();
    expect(response.fields).toHaveLength(3);
    response.fields.forEach((field, index) => {
      expect(field).toHaveProperty("name", mockTournaments[index].name);
      expect(field).toHaveProperty("value", mockTournaments[index].startDateTime.toLocaleString());
    });
  });

  it("returns success message when deleted tournament successfully", async () => {
    const mockDeleteTournament = mocked(Tournaments.remove).mockResolvedValueOnce(TournamentBuilder.single());
    const mockTournamentName = faker.random.words();
    const response = await deleteTournament(mockTournamentName);
    expect(response).toHaveProperty("title", `Removed ${mockTournamentName}`);
    expect(response).toHaveProperty("description", "Successfully removed tournament.");
    expect(mockDeleteTournament).toHaveBeenLastCalledWith(expect.objectContaining({ name: mockTournamentName }));
  });

  it("returns error message when deleted tournament fails", async () => {
    mocked(Tournaments.remove).mockResolvedValueOnce(null);
    const mockTournamentName = faker.random.words();
    const response = await deleteTournament(mockTournamentName);
    expect(response).toHaveProperty("title", "Tournament Not Found");
    expect(response).toHaveProperty(
      "description",
      `No tournament with the name **${mockTournamentName}** was not found. Run \`-tournament\` to see a list of all tournaments.`
    );
  });
});
