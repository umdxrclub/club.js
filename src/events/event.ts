import { Identifiable, ModelManager } from "../util/model-manager"
import { RecurrenceRule } from "./recurrence"

/**
 * A base event contains all information that events have in general. For
 * example, every event has a name, description, start and end date, etc.
 */
export interface ClubEventData extends Identifiable {
    /**
     * Whether the event should be published.
     */
    isPublished: boolean

    /**
     * The name of the event.
     */
    name: string,

    /**
     * The description of this event.
     */
    description?: string

    /**
     * The start date of the event.
     */
    startDate: Date,

    /**
     * The end date of the event.
     */
    endDate: Date,

    /**
     * A recurrence rule that specifies if/how this event should repeat.
     */
    repeat?: RecurrenceRule | undefined,

    /**
     * The url to a thumbnail for this event
     */
    thumbnail?: string | undefined

    /**
     * The location for this event, which can have an online and in person
     * location.
     */
    location: {
        irl?: string | undefined,
        online?: string | undefined
    },

    /**
     * Associated tags with this event
     */
    tags?: string[] | undefined
}