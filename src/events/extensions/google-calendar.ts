import { ModelExtension } from "../../model-manager"
import { BaseEvent } from "../event"

export interface GoogleCalendarEventExtension extends BaseEvent {
    gcal: {
        gCalId: string | undefined,
        publishOnGCal: boolean
    }
}

export function createGoogleCalendarExtension<T extends GoogleCalendarEventExtension>(): ModelExtension<T> {
    return {
        transformer: async (model) => {
            return {
                ...model,
                googleCalendarId: "something"
            }
        },
        destroyer: async (model) => {
            console.log("destroying google calendar...")
        }
    }
}