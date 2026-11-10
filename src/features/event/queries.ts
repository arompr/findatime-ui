import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GetEventResponse } from "@arompr/findatime-typescript-client";
import {
  deleteEvent,
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
import type { IntervalMinutes } from "@/lib/intervals";
import dayjs from "dayjs";

export const eventKeys = {
  all: ["events"] as const,
  byPublicId: (publicId: string | null) =>
    [...eventKeys.all, "publicId", publicId] as const,
  mine: () => [...eventKeys.all, "mine"] as const,
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
  /** Absolute instants, normalized to UTC ISO strings ("...Z"). */
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
  return useQuery({
    queryKey: eventKeys.mine(),
    queryFn: searchEvents,
    select: (data) =>
      data.events.some((event) => event.publicId === publicId && event.isOrganizer),
  });
}

/**
 * Everyone's availability for the event. The API returns UTC instants already
 * snapped to the event's grid; they are normalized to "...Z" ISO strings so
 * keys built from them (draft store, calendar) stay stable.
 */
export function useEventAvailabilities(publicId: string) {
  return useQuery({
    queryKey: availabilityKeys.forEvent(publicId),
    queryFn: async (): Promise<EventAvailabilities> => {
      const result = await getEventAvailabilities(publicId);
      return {
        participants: result.participants.map((participant) => ({
          participantId: participant.participantId,
          name: participant.name,
          ranges: participant.ranges.map((range) => ({
            startUtc: dayjs(range.start).toISOString(),
            endUtc: dayjs(range.end).toISOString(),
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

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => deleteEvent(publicId),
    onSuccess: (_data, publicId) => {
      clearSelections(publicId);
      queryClient.removeQueries({ queryKey: eventKeys.byPublicId(publicId) });
      queryClient.removeQueries({ queryKey: participantKeys.mine(publicId) });
      queryClient.removeQueries({ queryKey: availabilityKeys.forEvent(publicId) });
      void queryClient.invalidateQueries({ queryKey: eventKeys.mine() });
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
      dayStartHour: number;
      dayEndHour: number;
    }) => updateEventParams(input),
    onSuccess: (data, input) => {
      queryClient.setQueryData<GetEventResponse>(
        eventKeys.byPublicId(input.publicId),
        (event) =>
          event === undefined
            ? event
            : {
                ...event,
                timezone: data.timezone,
                intervalMinutes: data.intervalMinutes,
                dayStartHour: data.dayStartHour,
                dayEndHour: data.dayEndHour,
              },
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
    }) =>
      setAvailability({
        publicId: input.publicId,
        participantId: input.participantId,
        ranges: input.ranges.map((range) => ({ start: range.startUtc, end: range.endUtc })),
      }),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: availabilityKeys.forEvent(input.publicId),
      });
    },
  });
}
