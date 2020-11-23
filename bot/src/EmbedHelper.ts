import { MessageEmbed } from "discord.js";

export const BaseEmbed = (title: string, desc: string, color: string): MessageEmbed => {
  return new MessageEmbed()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setThumbnail("https://raw.githubusercontent.com/mattwells19/FUN.RocketLeague.TournamentSystem/main/media/FUN.png");
};

export const SuccessEmbed = (title: string, desc: string): MessageEmbed => {
  return BaseEmbed(title, desc, "GREEN");
};

export const InfoEmbed = (title: string, desc: string): MessageEmbed => {
  return BaseEmbed(title, desc, "BLUE");
};

export const ErrorEmbed = (title: string, desc: string): MessageEmbed => {
  return BaseEmbed(title, desc, "RED");
};
