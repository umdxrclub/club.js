import {
  ButtonStyle,
  ChannelType,
  ColorResolvable,
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
  fetchChannel,
  fetchMessage,
  sendMessage,
  tryFetchChannel,
} from "../../discord/messages";
import { ModelExtension } from "../../util/model-manager";
import { ClubEventData } from "../event";
import { logger } from "../../util/log";
import { createButtonComponents } from "../../discord/buttons";

type GuildEventRecord = {
  guildId: string;
  eventId: string;
};

type EventMessageRecord = {
  channelId: string;
  messageId: string;
};

export class DiscordClubEventExtension<T extends DiscordClubEventData>
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

export interface DiscordClubEventData extends ClubEventData {
  discord: {
    /**
     * Whether to create a guild scheduled event.
     */
    createGuildEvent?: boolean | undefined;

    /**
     * Whether to send embed messages describing the event.
     */
    createEmbedMessage?: boolean | undefined;

    /**
     * A list of guild events that are associated with this event.
     */
    guildEvents?: GuildEventRecord[] | undefined;

    /**
     * A list of embed messages that are associated with this event.
     */
    eventMessages?: EventMessageRecord[] | undefined;

    /**
     * The color of the event embed.
     */
    color?: string | undefined;

    /**
     * Which location to prioritize when publishing location information.
     */
    useLocation?:
      | "online"
      | "irl"
      | "irlAndOnline"
      | "onlineAndIrl"
      | undefined;
  };
}

export async function createEventEmbed(
  event: DiscordClubEventData
): Promise<EmbedBuilder> {
  let embed = new EmbedBuilder();

  embed.setTitle(event.name);
  if (event.description) embed.setDescription(event.description);
  if (event.thumbnail) embed.setImage(event.thumbnail);

  // Location
  let irl = event.location.irl
    ? await replaceChannelResolvableWithLink(event.location.irl)
    : undefined;
  let online = event.location.online
    ? await replaceChannelResolvableWithLink(event.location.online)
    : undefined;
  if (irl && online) {
    embed.addFields(
      {
        name: "IRL Location",
        value: irl,
        inline: true,
      },
      {
        name: "Online Location",
        value: online,
        inline: true,
      }
    );
  } else {
    let location = irl ?? online;
    if (location) {
      embed.addFields({
        name: "Location",
        value: location,
      });
    }
  }

  // Date & Time
  let startTime = event.startDate.getTime() / 1000.0;
  embed.addFields({
    name: "Start",
    value: `<t:${startTime}:F>`,
  });

  let endTime = event.endDate.getTime() / 1000.0;
  embed.addFields({
    name: "End",
    value: `<t:${endTime}:F>`,
  });

  // Tags
  if (event.tags && event.tags.length > 0) {
    embed.addFields({
      name: "Tags",
      value: event.tags.join(", "),
    });
  }

  if (event.discord.color) {
    let color = event.discord.color.startsWith("#")
      ? event.discord.color
      : `${event.discord.color}`;
    embed.setColor(color as ColorResolvable);
  }

  sanitizeEmbed(embed);

  return embed;
}

function getEventLocation(event: DiscordClubEventData) {
  let location: string | undefined;
  let online = event.location.online;
  let irl = event.location.irl;
  let useLocation = event.discord.useLocation;

  if (
    (useLocation == "irlAndOnline" || useLocation == "onlineAndIrl") &&
    irl &&
    online
  ) {
    location =
      useLocation == "irlAndOnline"
        ? `${irl} (${online})`
        : `${online} (${irl})`;
  } else if (useLocation == "irl" && irl) {
    location = irl;
  } else if (useLocation == "online" && online) {
    location = online;
  }

  // Default priority
  location ??= irl ?? online ?? "N/A";

  return location;
}

export async function updateGuildScheduledEvents(
  event: DiscordClubEventData,
  guildIds: string[]
): Promise<GuildEventRecord[] | undefined> {
  if (event.discord.createGuildEvent ?? true) {
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
  event: DiscordClubEventData,
  channelIds: string[]
): Promise<EventMessageRecord[] | undefined> {
  if (event.discord.createEmbedMessage ?? true) {
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

async function replaceChannelResolvableWithLink(str: string) {
  const channelRegex =
    /^(?:https?:\/\/(?:www.)?discord.com\/channels\/\d{18,19}\/)?(\d{18,19})$/;
  let match = channelRegex.exec(str);

  if (match) {
    let channelId = match[1];
    let channel = await tryFetchChannel(channelId);
    if (channel) {
      return `<#${channel.id}>`;
    }
  }

  return str;
}

async function prepareGuildEvent(
  event: DiscordClubEventData,
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
  let location = getEventLocation(event);
  const channelRegex =
    /^(?:https?:\/\/(?:www.)?discord.com\/channels\/\d{18,19}\/)?(\d{18,19})$/;
  let match = channelRegex.exec(location);

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
      location: location,
    };
  }

  return options;
}

async function createGuildEvent(event: DiscordClubEventData, guildId: string) {
  let guild = await getGuild(guildId);
  let details = await prepareGuildEvent(event, guildId);
  let scheduledEvent = await guild.scheduledEvents.create(details);

  logger.info(
    `Created guild event "${scheduledEvent.name}" (${scheduledEvent.id})`
  );

  return scheduledEvent;
}

async function editGuildEvent(
  event: DiscordClubEventData,
  guildId: string,
  eventId: string
) {
  let scheduledEvent = await fetchGuildEvent(guildId, eventId);
  let details = await prepareGuildEvent(event, guildId);
  let modifiedEvent = await scheduledEvent.edit(details);

  logger.info(
    `Edited guild event "${modifiedEvent.name}" (${modifiedEvent.id})`
  );

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
  logger.info(
    `Removed guild event "${scheduledEvent.name}" (${scheduledEvent.id})`
  );
}

async function removeAllGuildEvents(event: DiscordClubEventData) {
  if (!event.discord.guildEvents) return;
  let removePromises = event.discord.guildEvents.map((ge) =>
    removeGuildEvent(ge.guildId, ge.eventId)
  );

  await Promise.all(removePromises);
}

async function removeAllEventMessages(event: DiscordClubEventData) {
  if (!event.discord.eventMessages) return;
  let removePromises = event.discord.eventMessages.map((em) =>
    deleteMessage(em.channelId, em.messageId)
  );

  await Promise.all(removePromises);
}

export async function prepareEventMessage(
  event: DiscordClubEventData,
  channelId: string,
): Promise<DiscordMessage> {
  let embed = await createEventEmbed(event);
  let channel = await fetchChannel(channelId);
  let guildId: string | undefined = undefined;
  if (!channel.isDMBased()) {
    guildId = channel.guildId;
  }

  let guildEventRecord = event.discord.guildEvents?.find(
    (ge) => ge.guildId == guildId
  );

  // Add a discord event button, if one exists.
  let message: DiscordMessage = { embeds: [embed] };
  if (guildEventRecord) {
    let components = createButtonComponents([
      {
        style: ButtonStyle.Link,
        label: "View Discord Event",
        url: `https://discord.com/events/${guildId}/${guildEventRecord.eventId}`,
      },
    ]);

    message.components = components;
  }

  return message;
}

export async function createEventMessage(
  event: DiscordClubEventData,
  channelId: string
): Promise<Message> {
  let message = await prepareEventMessage(event, channelId);
  let sentMessage = await sendMessage(message, channelId);

  logger.info(`Created event message (${sentMessage.id})`);

  return sentMessage;
}

async function editEventMessage(
  event: DiscordClubEventData,
  channelId: string,
  messageId: string
): Promise<Message> {
  let fetchedMessage = await fetchMessage(channelId, messageId);
  let message = await prepareEventMessage(event, channelId);
  let editedMessage = await fetchedMessage.edit(message);

  logger.info(`Edited event message (${editedMessage.id})`);

  return editedMessage;
}
