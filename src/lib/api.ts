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
  timezone: string;
  /** Wall-clock datetimes without offset, in `timezone`. */
  ranges: Array<{ start: string; end: string }>;
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
      },
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

export function getMyParticipant(publicId: string): Promise<GetMyParticipantResponse> {
  return unwrap(FindAtimeApi.getMyParticipant({ path: { publicId } }));
}

export function getEventAvailabilities(
  publicId: string,
  timezone: string,
): Promise<GetEventAvailabilitiesResponse> {
  return unwrap(
    FindAtimeApi.getEventAvailabilities({
      path: { publicId },
      body: { timezone },
    }),
  );
}

export function setAvailability({
  publicId,
  participantId,
  timezone,
  ranges,
}: SetAvailabilityParams): Promise<SetAvailabilityResponse> {
  return unwrap(
    FindAtimeApi.setAvailability({
      path: { publicId, participantId },
      body: { timezone, ranges },
    }),
  );
}
