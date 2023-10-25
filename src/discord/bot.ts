import { Client } from "discord.js";

var client: Client | undefined = undefined;

export function setClient(newClient: Client | undefined) {
    client = newClient;
}

export function getDiscordClient(): Client {
    if (!client)
      throw new Error("No Discord client has been set!");

    return client;
}

export async function getGuild(guildId: string) {
    let client = getDiscordClient();
    let guild = await client.guilds.fetch(guildId);

    return guild;
}