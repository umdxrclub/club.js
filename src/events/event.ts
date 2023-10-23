import { Identifiable, ModelManager } from "../model-manager"

export interface BaseEvent extends Identifiable {
    name: string,
    startDate: Date,
    endDate: Date,
    repeat?: {
        
    }
    description?: string
    location: {
        irl?: string,
        online?: string
    },
    tags: string[],
    isPublished: boolean
}

export type Event<E> = BaseEvent & E;

export class EventManager<E> extends ModelManager<Event<E>> {

    public async publish() {

    }

    public async unPublish() {

    }
}