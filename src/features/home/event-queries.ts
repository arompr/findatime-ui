import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEvent, getEvent, joinByPublicId, searchEvents } from "@/lib/api";
import { loadAvailability, saveAvailability } from "@/lib/availability-storage";
import type { AvailabilitySelectionInput } from "@/lib/availability";
import { getOtherAvailability, type OtherAvailability } from "@/features/event/otherAvailability";
import { getGuestId } from "@/lib/guestId";

export function useEnsureGuestId() {
  useEffect(() => {
    getGuestId();
  }, []);
}

export const eventKeys = {
  all: ["events"] as const,
  byPublicId: (publicId: string | null) =>
    [...eventKeys.all, "publicId", publicId] as const,
  mine: (guestId: string) => [...eventKeys.all, "mine", guestId] as const,
};

export const availabilityKeys = {
  all: ["availability"] as const,
  mine: (publicId: string, guestId: string) =>
    [...availabilityKeys.all, "mine", publicId, guestId] as const,
  forEvent: (publicId: string, guestId: string) =>
    [...availabilityKeys.all, "event", publicId, guestId] as const,
};

export type EventAvailability = {
  me: AvailabilitySelectionInput[];
  others: OtherAvailability[];
};

export function useEventByPublicId(publicId: string | null) {
  return useQuery({
    queryKey: eventKeys.byPublicId(publicId),
    queryFn: () => getEvent(publicId as string),
    enabled: publicId !== null,
  });
}

export function useMyEvents() {
  return useQuery({
    queryKey: eventKeys.mine(getGuestId()),
    queryFn: () => searchEvents(getGuestId()),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; organizerName: string }) =>
      createEvent({ ...input, guestId: getGuestId() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function useJoinEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { publicId: string; name: string }) =>
      joinByPublicId({
        publicId: input.publicId,
        participantName: input.name,
        guestId: getGuestId(),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function useMySavedAvailability(publicId: string | null) {
  const guestId = getGuestId();
  return useQuery({
    queryKey: availabilityKeys.mine(publicId ?? "", guestId),
    queryFn: () => loadAvailability(publicId as string, guestId),
    enabled: publicId !== null,
  });
}

export function useAllAvailability(publicId: string | null) {
  const guestId = getGuestId();
  return useQuery<EventAvailability>({
    queryKey: availabilityKeys.forEvent(publicId ?? "", guestId),
    queryFn: () => ({
      me: loadAvailability(publicId as string, guestId),
      others: getOtherAvailability(),
    }),
    enabled: publicId !== null,
  });
}

export function useSaveAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      publicId: string;
      ranges: AvailabilitySelectionInput[];
    }) => {
      saveAvailability(input.publicId, getGuestId(), input.ranges);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
    },
  });
}
