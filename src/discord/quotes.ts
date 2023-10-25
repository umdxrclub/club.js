import { ButtonStyle, Embed, EmbedBuilder } from "discord.js";
import { getDiscordClient } from "./bot";
import { DiscordMessage } from "./messages";
import { createButtonComponents } from "./buttons";

export async function prepareQuote(
  quote: string,
  authorId: string
): Promise<DiscordMessage> {
  let client = getDiscordClient();
  let author = await client.users.fetch(authorId);
  let profilePicture = author.avatarURL();

  let embed = new EmbedBuilder();
  embed.setAuthor({
    name: author.displayName,
    iconURL: profilePicture ?? undefined
  });
  
  embed.setDescription(`"${quote}"`);

  return { embeds: [embed] };
}
