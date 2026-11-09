import {
  client,
  FindAtimeApi,
  type CreateEventResponse,
  type GetEventAvailabilitiesResponse,
  type GetEventResponse,
  type GetMyParticipantResponse,
  type JoinEventResponse,
  type SearchEventsResponse,
  type SetAvailabilityResponse,
  type UpdateEventParamsResponse,
} from "@arompr/findatime-typescript-client";
import { ApiRequestError } from "./errors";
import { getGuestId } from "./guestId";
import { browserTimezone } from "./time";

client.setConfig({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:5263",
  // Guest identity for the endpoints that resolve "me" from a header
  // (getMyParticipant, setAvailability).
  headers: { "X-Guest-Id": getGuestId() },
});

type Envelope<T> = {
  data?: T;
  error?: unknown;
  response?: Response;
};

/**
 * The client returns `{ data, error, response }` instead of throwing; unwrap it
 * so callers (TanStack Query) get plain promises that reject with
 * ApiRequestError on failure.
 */
async function unwrap<T>(result: Promise<Envelope<T>>): Promise<T> {
  const { data, error, response } = await result;
  if (!response?.ok) {
    throw ApiRequestError.from(error, response);
  }
  return data as T;
}

export type CreateEventParams = {
  name: string;
  organizerName: string;
};

export type JoinEventParams = {
  publicId: string;
  participantName: string;
};

export type SetAvailabilityParams = {
  publicId: string;
  participantId: string;
  /** ISO 8601 instants with an explicit offset (UTC "Z"). */
  ranges: Array<{ start: string; end: string }>;
};

export type UpdateEventParamsInput = {
  publicId: string;
  /** The event's anchor timezone; null means UTC (legacy events). */
  timezone: string | null;
  intervalMinutes: number;
  /** Whole hours in the event's anchor frame; start < end. */
  dayStartHour: number;
  dayEndHour: number;
};

export function getEvent(publicId: string): Promise<GetEventResponse> {
  return unwrap(FindAtimeApi.getEvent({ path: { publicId } }));
}

export function searchEvents(guestId: string): Promise<SearchEventsResponse> {
  return unwrap(FindAtimeApi.searchEvents({ query: { guestId } }));
}

export function createEvent({
  name,
  organizerName,
}: CreateEventParams): Promise<CreateEventResponse> {
  return unwrap(
    FindAtimeApi.createEvent({
      body: {
        name,
        guestId: getGuestId(),
        organizerName,
        isPasscodeProtected: false,
        // The creator's timezone anchors the event's hours and slot grid.
        timezone: browserTimezone(),
      },
    }),
  );
}

export function deleteEvent(publicId: string): Promise<void> {
  return unwrap<void>(FindAtimeApi.deleteEvent({ path: { publicId } }));
}

export function updateEventParams({
  publicId,
  timezone,
  intervalMinutes,
  dayStartHour,
  dayEndHour,
}: UpdateEventParamsInput): Promise<UpdateEventParamsResponse> {
  return unwrap(
    FindAtimeApi.updateEventParams({
      path: { publicId },
      body: { timezone, intervalMinutes, dayStartHour, dayEndHour },
    }),
  );
}

export function joinEvent({
  publicId,
  participantName,
}: JoinEventParams): Promise<JoinEventResponse> {
  return unwrap(
    FindAtimeApi.joinEvent({
      path: { publicId },
      body: {
        passcode: null,
        guestId: getGuestId(),
        participantName,
        // Recorded for future use; the API doesn't read it yet.
        timezone: browserTimezone(),
      },
    }),
  );
}

export function leaveEvent(publicId: string): Promise<void> {
  return unwrap<void>(
    FindAtimeApi.leaveEvent({
      path: { publicId },
      body: { guestId: getGuestId() },
    }),
  );
}

export function getMyParticipant(
  publicId: string,
): Promise<GetMyParticipantResponse> {
  return unwrap(FindAtimeApi.getMyParticipant({ path: { publicId } }));
}

export function getEventAvailabilities(
  publicId: string,
): Promise<GetEventAvailabilitiesResponse> {
  return unwrap(FindAtimeApi.getEventAvailabilities({ path: { publicId } }));
}

export function setAvailability({
  publicId,
  participantId,
  ranges,
}: SetAvailabilityParams): Promise<SetAvailabilityResponse> {
  return unwrap(
    FindAtimeApi.setAvailability({
      path: { publicId, participantId },
      body: { ranges },
    }),
  );
}
