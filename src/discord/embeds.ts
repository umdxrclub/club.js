import { EmbedBuilder } from "discord.js";

export function truncate(str: string, maxChars: number, trail: string = "...") {
  let maxLength = maxChars - trail.length;

  if (str.length > maxLength) {
    str = str.substring(0, maxLength) + trail;
  }

  return str;
}

export function sanitizeEmbed(embed: EmbedBuilder) {
  if (embed.data.title) embed.setTitle(truncate(embed.data.title, 256))
  if (embed.data.description) embed.setDescription(truncate(embed.data.description, 4096))
}
