import { ButtonStyle, Client } from "discord.js";
import { configDotenv } from "dotenv";
import { setClient } from "../src/discord/bot";
import { DiscordButton } from "../src/discord/buttons";
import { ClubEventData } from "../src/events/event";
import {
  DiscordClubEventData, DiscordClubEventExtension
} from "../src/events/extensions/discord";
import {
  GCalClubEventData,
  GCalEventExtension,
} from "../src/events/extensions/gcal";
import { setGApiAuthentication } from "../src/gapi/auth";
import { ModelManager } from "../src/util/model-manager";
import { sleep } from "../src/util/util";

configDotenv();

var client = new Client({
  intents: [],
});

type MyEvent = ClubEventData & DiscordClubEventData & GCalClubEventData;

client.once("ready", async () => {
  console.log("Logged in as: " + client.user?.displayName);
  setClient(client);
  setGApiAuthentication(
    process.env.GAPI_CLIENT_KEY!,
    process.env.GAPI_CLIENT_SECRET!,
    process.env.GAPI_REFRESH_TOKEN!
  );

  let buttonArray: DiscordButton[] = [];
  for (var i = 0; i < 25; i++) {
    buttonArray.push({
      style: ButtonStyle.Link,
      url: "https://example.com",
      disabled: i > 10,
      label: "Button #" + i,
    });
  }

  let date = new Date("10-30-2024");
  let endDate = new Date("10-31-2024");

  let event: MyEvent = {
    id: "breh",
    name: "XR Club Party",
    description: "Come party with us!",
    location: {
      irl: "AVW 4176",
      online: "755636632312348813",
    },
    thumbnail:
      "https://media.discordapp.net/attachments/1006353924980228226/1166041102432862239/Spookality.png",
    tags: ["fun", "party", "epic", "<@&1060378391095820369>"],
    startDate: date,
    endDate: endDate,
    isPublished: true,
    discord: {
      color: "#ff0000"
    },
    gcal: {
      publishOnGCal: true,
      events: undefined,
    },
  };

  let discord = new DiscordClubEventExtension<MyEvent>({
    "980181387904684082": "1061318837708009633",
  });
  let gcal = new GCalEventExtension<MyEvent>([
    "1f40377e63e0a5a6033387068f8d3b1ceb14a2d526d1d254eaafd7c4f34c3a22@group.calendar.google.com",
  ]);

  let eventManager = new ModelManager<MyEvent>();
  eventManager.addExtension(discord);
  eventManager.addExtension(gcal);

  event = await eventManager.transform(event, undefined);
  console.log(event)
  console.log("created event");
  await sleep(30000);
  await eventManager.destroy(event);
  console.log("destroyed event");
});

client.login(process.env.DISCORD_TOKEN);
