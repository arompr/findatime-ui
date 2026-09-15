import {
  FindAtimeApiService,
  OpenAPI,
} from "@arompr/findatime-typescript-client";
import type {
  CreateEventResponse,
  GetEventResponse,
  JoinEventResponse,
  SearchEventsResponse,
} from "@arompr/findatime-typescript-client";

OpenAPI.BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5263";

export type JoinByPublicIdParams = {
  publicId: string;
  guestId: string;
  participantName: string;
};

export type CreateEventParams = {
  name: string;
  guestId: string;
  organizerName: string;
};

export function getEvent(publicId: string): Promise<GetEventResponse> {
  return FindAtimeApiService.getEvent(publicId);
}

export function searchEvents(guestId: string): Promise<SearchEventsResponse> {
  return FindAtimeApiService.searchEvents(guestId);
}

export async function joinByPublicId({
  publicId,
  guestId,
  participantName,
}: JoinByPublicIdParams): Promise<JoinEventResponse> {
  return await FindAtimeApiService.joinEvent(publicId, {
    passcode: null,
    guestId,
    participantName,
  });
}

export function createEvent({
  name,
  guestId,
  organizerName,
}: CreateEventParams): Promise<CreateEventResponse> {
  return FindAtimeApiService.createEvent({
    name,
    guestId,
    organizerName,
    isPasscodeProtected: false,
  });
}
