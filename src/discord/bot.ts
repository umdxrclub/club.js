import { Client } from "discord.js";

var client: Client | undefined = undefined;

export function setClient(newClient: Client | undefined) {
    client = newClient;
}

export function getDiscordClient() {
    if (!client)
      throw new Error("No Discord client has been set!");
    
    return client;
}