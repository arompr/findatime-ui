import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GetEventResponse } from "@arompr/findatime-typescript-client";
import {
  getEvent,
  getEventAvailabilities,
  getMyParticipant,
  joinEvent,
  leaveEvent,
  searchEvents,
  setAvailability,
  updateEventParams,
} from "@/lib/api";
import type { AvailabilityRange } from "@/lib/availability";
import { clearSelections } from "@/lib/availability";
import { getGuestId } from "@/lib/guestId";
import type { IntervalMinutes } from "@/lib/intervals";
import { browserTimezone, instantToWallClock, wallClockToInstant } from "@/lib/time";

export const eventKeys = {
  all: ["events"] as const,
  byPublicId: (publicId: string | null) =>
    [...eventKeys.all, "publicId", publicId] as const,
  mine: (guestId: string) => [...eventKeys.all, "mine", guestId] as const,
};

export const participantKeys = {
  mine: (publicId: string) => ["participant", publicId] as const,
};

export const availabilityKeys = {
  forEvent: (publicId: string) => ["availability", publicId] as const,
};

export type ParticipantAvailability = {
  participantId: string;
  name: string;
  /** Absolute instants, converted from the API's wall-clock frame. */
  ranges: AvailabilityRange[];
};

export type EventAvailabilities = {
  participants: ParticipantAvailability[];
};

export function useEventByPublicId(publicId: string | null) {
  return useQuery({
    queryKey: eventKeys.byPublicId(publicId),
    queryFn: () => getEvent(publicId as string),
    enabled: publicId !== null,
  });
}

/**
 * The current guest's participant in this event. A `participant_not_found`
 * error means "not joined yet" (see isNotJoined) and drives the join panel.
 */
export function useMyParticipant(publicId: string) {
  return useQuery({
    queryKey: participantKeys.mine(publicId),
    queryFn: () => getMyParticipant(publicId),
  });
}

/**
 * Whether the current guest organizes this event. The event read endpoint
 * doesn't expose the role, so this reuses the "my events" search (already
 * cached by the home page) and picks out this event.
 */
export function useIsOrganizer(publicId: string) {
  const guestId = getGuestId();
  return useQuery({
    queryKey: eventKeys.mine(guestId),
    queryFn: () => searchEvents(guestId),
    select: (data) =>
      data.events.some((event) => event.publicId === publicId && event.isOrganizer),
  });
}

/**
 * Everyone's availability for the event, requested in the browser's timezone
 * and converted to absolute instants for the calendar.
 */
export function useEventAvailabilities(publicId: string) {
  return useQuery({
    queryKey: availabilityKeys.forEvent(publicId),
    queryFn: async (): Promise<EventAvailabilities> => {
      const result = await getEventAvailabilities(publicId, browserTimezone());
      return {
        participants: result.participants.map((participant) => ({
          participantId: participant.participantId,
          name: participant.name,
          ranges: participant.ranges.map((range) => ({
            startUtc: wallClockToInstant(range.start, result.timezone),
            endUtc: wallClockToInstant(range.end, result.timezone),
          })),
        })),
      };
    },
    refetchOnWindowFocus: true,
  });
}

export function useJoinEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { publicId: string; name: string }) =>
      joinEvent({ publicId: input.publicId, participantName: input.name }),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
      void queryClient.invalidateQueries({ queryKey: participantKeys.mine(input.publicId) });
      void queryClient.invalidateQueries({
        queryKey: availabilityKeys.forEvent(input.publicId),
      });
    },
  });
}

export function useLeaveEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => leaveEvent(publicId),
    onSuccess: (_data, publicId) => {
      clearSelections(publicId);
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
      void queryClient.invalidateQueries({ queryKey: participantKeys.mine(publicId) });
      void queryClient.invalidateQueries({
        queryKey: availabilityKeys.forEvent(publicId),
      });
    },
  });
}

export function useUpdateEventParams() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      publicId: string;
      timezone: string | null;
      intervalMinutes: IntervalMinutes;
    }) => updateEventParams(input),
    onSuccess: (data, input) => {
      queryClient.setQueryData<GetEventResponse>(
        eventKeys.byPublicId(input.publicId),
        (event) =>
          event === undefined
            ? event
            : { ...event, timezone: data.timezone, intervalMinutes: data.intervalMinutes },
      );
      void queryClient.invalidateQueries({
        queryKey: availabilityKeys.forEvent(input.publicId),
      });
    },
  });
}

export function useSetAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      publicId: string;
      participantId: string;
      ranges: AvailabilityRange[];
    }) => {
      const timezone = browserTimezone();
      return setAvailability({
        publicId: input.publicId,
        participantId: input.participantId,
        timezone,
        ranges: input.ranges.map((range) => ({
          start: instantToWallClock(range.startUtc, timezone),
          end: instantToWallClock(range.endUtc, timezone),
        })),
      });
    },
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: availabilityKeys.forEvent(input.publicId),
      });
    },
  });
}
