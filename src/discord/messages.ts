import {
  Channel,
  Message,
  MessageCreateOptions,
  MessageEditOptions,
  MessagePayload,
  TextBasedChannel,
} from "discord.js";
import { getDiscordClient } from "./bot";

export type DiscordCreatableMessage =
  | string
  | MessagePayload
  | MessageCreateOptions;
export type DiscordEditableMessage =
  | string
  | MessagePayload
  | MessageEditOptions;
export type DiscordMessage = DiscordCreatableMessage & DiscordEditableMessage;

export async function fetchChannel(channelId: string): Promise<Channel> {
  let channel = await tryFetchChannel(channelId);
  if (!channel) throw new Error("Channel could not be found!");

  return channel;
}

export async function tryFetchChannel(channelId: string): Promise<Channel | null> {
  let client = getDiscordClient();

  let channel = await client.channels.fetch(channelId);

  return channel;
}

export async function fetchTextChannel(
  channelId: string
): Promise<TextBasedChannel> {
  let channel = await fetchChannel(channelId);

  if (!channel.isTextBased()) throw new Error("Channel is not text based!");

  return channel;
}

export async function sendMessage(
  message: DiscordCreatableMessage,
  channelId: string
): Promise<Message> {
  let channel = await fetchTextChannel(channelId);

  let sentMessage = await channel.send(message);

  return sentMessage;
}

export async function fetchMessage(channelId: string, messageId: string) {
  let channel = await fetchTextChannel(channelId);

  let fetchedMessage = await channel.messages.fetch(messageId);

  return fetchedMessage;
}

export async function editMessage(
  message: DiscordEditableMessage,
  channelId: string,
  messageId: string
): Promise<Message> {
  let fetchedMessage = await fetchMessage(channelId, messageId);
  let editedMessage = await fetchedMessage.edit(message);

  return editedMessage;
}

export async function deleteMessage(channelId: string, messageId: string): Promise<void> {
    let fetchedMessage = await fetchMessage(channelId, messageId);
    await fetchedMessage.delete();
}
