import { GCalEventNoId, createGCalEvent, deleteGCalEvent, editGCalEvent } from "../../gapi/calendar";
import {
    ModelExtension
} from "../../model-manager";
import { BaseEvent } from "../event";

type GCalEventRecord = {
  eventId: string;
  calendarId: string;
};

export interface EventWithGCal extends BaseEvent {
  gcal: {
    publishOnGCal: boolean;
    events: GCalEventRecord[] | undefined;
  };
}

export class GCalEventExtension<T extends EventWithGCal>
  implements ModelExtension<T>
{
  private _calendarIds: string[] = [];

  constructor(calendarIds: string[]) {
    this._calendarIds = calendarIds;
  }

  public async transform(model: T, prevModel: T | undefined) {
    let newModel = Object.assign({}, model);

    if (model.gcal.publishOnGCal) {
        let newRecords: GCalEventRecord[] = []
        for (var cid of this._calendarIds) {
            let existingEvent = model.gcal.events?.find(e => e.calendarId === cid);
            let calEvent = prepareGCalEvent(model);
            let eventId: string;

            if (existingEvent) {
                let editedEvent = await editGCalEvent(calEvent, cid, existingEvent.eventId);
                eventId = editedEvent.id!;
            } else {
                let createdEvent = await createGCalEvent(calEvent, cid)
                eventId = createdEvent.id!;
            }

            let newRecord: GCalEventRecord = {
                calendarId: cid,
                eventId: eventId
            }

            newRecords.push(newRecord)
        }

        newModel.gcal.events = newRecords;
    } else {
      // Delete remaining Google Calendar events.
      await this.destroy(model);
      newModel.gcal.events = undefined;
    }

    return newModel;
  }

  public async destroy(model: T) {
    if (model.gcal.events) {
      let promises = model.gcal.events.map((e) =>
        deleteGCalEvent(e.eventId, e.calendarId)
      );
      await Promise.all(promises);
    }
  }
}

function prepareGCalEvent(event: BaseEvent): GCalEventNoId {
  let calEvent: GCalEventNoId = {
    summary: event.name,
    description: event.description,
    location: event.location.online,
    start: {
      dateTime: event.startDate.toISOString(),
    },
    end: {
      dateTime: event.endDate.toISOString(),
    },
  };

  return calEvent;
}
