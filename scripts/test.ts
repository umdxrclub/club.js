import { sendMessage } from "../src/discord/messages";

let sentMessage = await sendMessage("channel id", {
    content: "lolololol",
    embeds: []
})