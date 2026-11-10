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
import { getGuestToken, resetGuestToken } from "./guestToken";
import { browserTimezone } from "./time";

const AUTH_SCHEME = "Guest ";

client.setConfig({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:5263",
  // Only sent on operations the API marks as authenticated.
  auth: async () => `${AUTH_SCHEME}${await getGuestToken()}`,
});

type Envelope<T> = {
  data?: T;
  error?: unknown;
  request?: Request;
  response?: Response;
};

/**
 * The client returns `{ data, error, response }` instead of throwing; unwrap it
 * so callers (TanStack Query) get plain promises that reject with
 * ApiRequestError on failure.
 *
 * A 401 means the API doesn't know this browser's token (e.g. its database was
 * reset): drop the token and retry once with a freshly issued one.
 */
async function unwrap<T>(call: () => Promise<Envelope<T>>): Promise<T> {
  let { data, error, request, response } = await call();
  const sentToken = request?.headers.get("Authorization")?.slice(AUTH_SCHEME.length);
  if (response?.status === 401 && sentToken) {
    resetGuestToken(sentToken);
    ({ data, error, response } = await call());
  }
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
  return unwrap(() => FindAtimeApi.getEvent({ path: { publicId } }));
}

export function searchEvents(): Promise<SearchEventsResponse> {
  return unwrap(() => FindAtimeApi.searchEvents());
}

export function createEvent({
  name,
  organizerName,
}: CreateEventParams): Promise<CreateEventResponse> {
  return unwrap(() =>
    FindAtimeApi.createEvent({
      body: {
        name,
        organizerName,
        isPasscodeProtected: false,
        // The creator's timezone anchors the event's hours and slot grid.
        timezone: browserTimezone(),
      },
    }),
  );
}

export function deleteEvent(publicId: string): Promise<void> {
  return unwrap<void>(() => FindAtimeApi.deleteEvent({ path: { publicId } }));
}

export function updateEventParams({
  publicId,
  timezone,
  intervalMinutes,
  dayStartHour,
  dayEndHour,
}: UpdateEventParamsInput): Promise<UpdateEventParamsResponse> {
  return unwrap(() =>
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
  return unwrap(() =>
    FindAtimeApi.joinEvent({
      path: { publicId },
      body: {
        passcode: null,
        participantName,
        // Recorded for future use; the API doesn't read it yet.
        timezone: browserTimezone(),
      },
    }),
  );
}

export function leaveEvent(publicId: string): Promise<void> {
  return unwrap<void>(() => FindAtimeApi.leaveEvent({ path: { publicId } }));
}

export function getMyParticipant(
  publicId: string,
): Promise<GetMyParticipantResponse> {
  return unwrap(() => FindAtimeApi.getMyParticipant({ path: { publicId } }));
}

export function getEventAvailabilities(
  publicId: string,
): Promise<GetEventAvailabilitiesResponse> {
  return unwrap(() => FindAtimeApi.getEventAvailabilities({ path: { publicId } }));
}

export function setAvailability({
  publicId,
  participantId,
  ranges,
}: SetAvailabilityParams): Promise<SetAvailabilityResponse> {
  return unwrap(() =>
    FindAtimeApi.setAvailability({
      path: { publicId, participantId },
      body: { ranges },
    }),
  );
}
