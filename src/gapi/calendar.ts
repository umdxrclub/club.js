import { calendar_v3, google } from "googleapis";
import { getGApiAuthentication } from "./auth";

export type GCalEvent = calendar_v3.Schema$Event;
export type GCalEventWithId = GCalEvent & {
    id: string
}
export type GCalEventNoId = Omit<GCalEvent, "id">

var _calendarClient: calendar_v3.Calendar | undefined = undefined;

function getCalendarClient() {
    if (!_calendarClient) {
        _calendarClient = google.calendar({
            version: "v3",
            auth: getGApiAuthentication()
        })
    }

    return _calendarClient;
}

export async function createGCalEvent(event: GCalEventNoId, calendarId: string): Promise<calendar_v3.Schema$Event> {
    let cal = getCalendarClient();
    let response = await cal.events.insert({
        calendarId: calendarId,
        requestBody: event
    })

    if (response.status != 200)
        throw new Error("Error while creating calendar event: " + response.statusText)

    return response.data;
}

export async function editGCalEventWithId(event: GCalEventWithId, calendarId: string): Promise<GCalEvent> {
    let cal = getCalendarClient();
    let response = await cal.events.update({
        calendarId: calendarId,
        eventId: event.id,
        requestBody: event
    })

    if (response.status != 200)
        throw new Error("Error while editing calendar event: " + response.statusText)

    return response.data;
}

export async function editGCalEvent(event: GCalEventNoId, calendarId: string, eventId: string) {
    let eventWithId: GCalEventWithId = {
        ...event,
        id: eventId
    }

    return await editGCalEventWithId(eventWithId, calendarId)
}

export function deleteGCalEvent(event: GCalEventWithId | string, calendarId: string) {
    let cal = getCalendarClient();
    let eventId = typeof(event) === "string" ? event : event.id;

    cal.events.delete({
        calendarId: calendarId,
        eventId: eventId
    })
}
