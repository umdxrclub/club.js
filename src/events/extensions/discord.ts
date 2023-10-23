import { ModelExtension, ModelTransformer } from "../../model-manager"
import { BaseEvent } from "../event"

export interface DiscordEventExtension extends BaseEvent {
    discord: {
        guildEvents: {
            guildId: string,
            messageId: string
        }[] | undefined,
        embedMessages: {
            channelId: string,
            messageId: string
        }[] | undefined
    }
}

export function createDiscordExtension<T extends DiscordEventExtension>(): ModelExtension<T> {
    return {
        transformer: async (model) => {
            return {
                ...model,
                discord:  {
                    guildEvents: ["123456"],
                    embedMessages: ["78901234"]
                }
            }
        },
        destroyer: async (model) => {
            console.log("destroying discord...")
        }
    }
}