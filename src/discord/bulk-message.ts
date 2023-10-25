import { Message } from "discord.js";
import { DiscordCreatableMessage, DiscordEditableMessage, DiscordMessage, sendMessage } from "./messages";

export async function sendBulkMessage(channelId: string, messages: DiscordCreatableMessage[]): Promise<Message[]> {
    let sentMessages: Message[] = []

    for (var message of messages) {
        let sentMessage = await sendMessage(message, channelId);
        sentMessages.push(sentMessage);
    }

    return sentMessages;
}

export async function editBulkMessage(channelId: string, messageIds: string[], messages: DiscordEditableMessage[]) {

}