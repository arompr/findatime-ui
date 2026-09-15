import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEvent, getEvent, joinByPublicId, searchEvents } from "@/lib/api";
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
