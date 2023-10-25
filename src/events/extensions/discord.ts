import {
  ChannelType,
  EmbedBuilder,
  GuildScheduledEvent,
  GuildScheduledEventCreateOptions,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
  Message,
} from "discord.js";
import { getGuild } from "../../discord/bot";
import { sanitizeEmbed } from "../../discord/embeds";
import {
  DiscordMessage,
  deleteMessage,
  fetchMessage,
  sendMessage,
  tryFetchChannel,
} from "../../discord/messages";
import { ModelExtension, ModelTransformer } from "../../model-manager";
import { BaseEvent } from "../event";

type GuildEventRecord = {
  guildId: string;
  eventId: string;
};

type EventMessageRecord = {
  channelId: string;
  messageId: string;
};

export class DiscordEventExtension<T extends EventWithDiscord>
  implements ModelExtension<T>
{
  private _guilds: Map<string, string>;

  constructor(guilds: Record<string, string>) {
    this._guilds = new Map();

    // Import all the servers
    Object.entries(guilds).forEach(([k, v]) => this._guilds.set(k, v));
  }

  public async transform(model: T, prevModel: T | undefined): Promise<T> {
    let newModel = Object.assign({}, model);
    newModel.discord.guildEvents = await updateGuildScheduledEvents(
      newModel,
      Array.from(this._guilds.keys())
    );
    newModel.discord.eventMessages = await updateEventMessages(
      newModel,
      Array.from(this._guilds.values())
    );

    return newModel;
  }

  public async destroy(model: T) {
    await removeAllEventMessages(model);
    await removeAllGuildEvents(model);
  }
}

export interface EventWithDiscord extends BaseEvent {
  discord: {
    createGuildEvent: boolean;
    createEmbedMessage: boolean;
    guildEvents: GuildEventRecord[] | undefined;
    eventMessages: EventMessageRecord[] | undefined;
  };
}

export function createEventEmbed(event: BaseEvent): EmbedBuilder {
  let embed = new EmbedBuilder();

  embed.setTitle(event.name);
  if (event.description) embed.setDescription(event.description);
  if (event.thumbnail) embed.setImage(event.thumbnail);
  if (event.tags.length > 0) {
    embed.addFields({
      name: "Tags",
      value: event.tags.join(", "),
    });
  }

  embed.setThumbnail(
    "https://xr.umd.edu/images/XR_Club_Logo_with_Outer_Circle.png"
  );

  sanitizeEmbed(embed);

  return embed;
}

export async function updateGuildScheduledEvents(
  event: EventWithDiscord,
  guildIds: string[]
): Promise<GuildEventRecord[] | undefined> {
  if (event.discord.createGuildEvent) {
    let newGuildRecords: GuildEventRecord[] = [];
    for (var guildId of guildIds) {
      let existingRecord = event.discord.guildEvents?.find(
        (gr) => gr.guildId === guildId
      );
      let scheduledEvent: GuildScheduledEvent;

      // Create or edit the event
      if (existingRecord) {
        scheduledEvent = await editGuildEvent(
          event,
          existingRecord.guildId,
          existingRecord.eventId
        );
      } else {
        scheduledEvent = await createGuildEvent(event, guildId);
      }

      // Add the new event
      newGuildRecords.push({
        guildId: guildId,
        eventId: scheduledEvent.id,
      });
    }

    return newGuildRecords;
  } else {
    // If there are any guild events, delete them all.
    await removeAllGuildEvents(event);

    return undefined;
  }
}

export async function updateEventMessages(
  event: EventWithDiscord,
  channelIds: string[]
): Promise<EventMessageRecord[] | undefined> {
  if (event.discord.createEmbedMessage) {
    let newEventMessages: EventMessageRecord[] = [];
    for (var channelId of channelIds) {
      let existingMessage = event.discord.eventMessages?.find(
        (em) => em.channelId === channelId
      );

      // Create or edit the message
      let sentMessage: Message;
      if (existingMessage) {
        sentMessage = await editEventMessage(
          event,
          existingMessage.channelId,
          existingMessage.messageId
        );
      } else {
        sentMessage = await createEventMessage(event, channelId);
      }

      // Add the new event
      newEventMessages.push({
        channelId: channelId,
        messageId: sentMessage.id,
      });

      return newEventMessages;
    }
  } else {
    await removeAllEventMessages(event);

    return undefined;
  }
}

async function prepareGuildEvent(
  event: BaseEvent,
  guildId: string
): Promise<GuildScheduledEventCreateOptions> {
  let options: GuildScheduledEventCreateOptions = {
    name: event.name,
    scheduledStartTime: event.startDate,
    scheduledEndTime: event.endDate,
    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
    entityType: GuildScheduledEventEntityType.External,
    description: event.description,
    image: event.thumbnail,
  };

  // Check if the online location field is just a discord voice channel.
  const channelRegex =
    /^(?:https?:\/\/(?:www.)?discord.com\/channels\/\d{18,19}\/)?(\d{18,19})$/;
  let match = channelRegex.exec(event.location.online ?? "");

  if (match) {
    let channelId = match[1];
    let channel = await tryFetchChannel(channelId);

    // Ensure that the channel exists, is a voice channel, and the voice channel
    // is on the guild that this event is being prepared for.
    if (channel && channel.isVoiceBased() && channel.guildId == guildId) {
      options.entityType =
        channel.type == ChannelType.GuildStageVoice
          ? GuildScheduledEventEntityType.StageInstance
          : GuildScheduledEventEntityType.Voice;
      options.channel = channel.id;
    }
  }

  // Check if the type is still external, and if so, add the required location
  // field.
  if (options.entityType == GuildScheduledEventEntityType.External) {
    options.entityMetadata = {
      location: event.location.online ?? event.location.irl ?? "unknown",
    };
  }

  return options;
}

async function createGuildEvent(event: BaseEvent, guildId: string) {
  let guild = await getGuild(guildId);
  let details = await prepareGuildEvent(event, guildId);
  let scheduledEvent = await guild.scheduledEvents.create(details);

  return scheduledEvent;
}

async function editGuildEvent(
  event: BaseEvent,
  guildId: string,
  eventId: string
) {
  let scheduledEvent = await fetchGuildEvent(guildId, eventId);
  let details = await prepareGuildEvent(event, guildId);
  let modifiedEvent = await scheduledEvent.edit(details);

  return modifiedEvent;
}

async function fetchGuildEvent(guildId: string, eventId: string) {
  let guild = await getGuild(guildId);
  let scheduledEvent = await guild.scheduledEvents.fetch(eventId);

  return scheduledEvent;
}

async function removeGuildEvent(guildId: string, eventId: string) {
  let scheduledEvent = await fetchGuildEvent(guildId, eventId);
  await scheduledEvent.delete();
}

async function removeAllGuildEvents(event: EventWithDiscord) {
  if (!event.discord.guildEvents) return;
  let removePromises = event.discord.guildEvents.map((ge) =>
    removeGuildEvent(ge.guildId, ge.eventId)
  );

  await Promise.all(removePromises);
}

async function removeAllEventMessages(event: EventWithDiscord) {
  if (!event.discord.eventMessages) return;
  let removePromises = event.discord.eventMessages.map((em) =>
    deleteMessage(em.channelId, em.messageId)
  );

  await Promise.all(removePromises);
}

export function prepareEventMessage(event: EventWithDiscord): DiscordMessage {
  let embed = createEventEmbed(event);

  return { embeds: [embed] };
}

export async function createEventMessage(
  event: EventWithDiscord,
  channelId: string
): Promise<Message> {
  let message = prepareEventMessage(event);
  let sentMessage = await sendMessage(message, channelId);

  return sentMessage;
}

async function editEventMessage(
  event: EventWithDiscord,
  channelId: string,
  messageId: string
): Promise<Message> {
  let fetchedMessage = await fetchMessage(channelId, messageId);
  let message = prepareEventMessage(event);
  let editedMessage = await fetchedMessage.edit(message);

  return editedMessage;
}
