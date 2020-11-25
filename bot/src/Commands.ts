import { MessageEmbed } from "discord.js";
import { ErrorEmbed } from "./EmbedHelper";

export interface ICommandParameters {
  authorId: string; // the author of the message (Discord User)
  args: string[]; // the extra arguments with the mentions removed
  mentionsIds: string[]; // the collection of mentions in the message
  isAdmin: boolean; // whether or not the message came from the specified admin channel
}

export type CommandFunctionType = (args: ICommandParameters) => Promise<MessageEmbed>;

interface ICommandSpecs {
  command: string;
  commandFunction: CommandFunctionType;
  isAdminCommand: boolean;
}

class Commands {
  private commandList: ICommandSpecs[];

  constructor() {
    this.commandList = [];
  }

  public registerCommand(command: string, commandFunction: CommandFunctionType, isAdminCommand = false) {
    this.commandList.push({
      command,
      commandFunction,
      isAdminCommand,
    });
  }

  public async processCommand(command: string, args: ICommandParameters): Promise<MessageEmbed> {
    const specifiedCommand = this.commandList.find((c) => c.command === command);
    if (specifiedCommand && (!specifiedCommand.isAdminCommand || args.isAdmin))
      return await specifiedCommand.commandFunction({ ...args });
    else return ErrorEmbed("Command Not Found", "");
  }
}

export default new Commands();
