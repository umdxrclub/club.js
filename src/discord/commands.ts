import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";

type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">;

export interface SlashCommand {
    data: SlashCommandData
    onInvoke: (interaction: ChatInputCommandInteraction<CacheType>) => void;
}
