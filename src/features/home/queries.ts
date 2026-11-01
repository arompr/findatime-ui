import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEvent, searchEvents } from "@/lib/api";
import { getGuestId } from "@/lib/guestId";
import { eventKeys } from "@/features/event/queries";

export function useEnsureGuestId() {
  useEffect(() => {
    getGuestId();
  }, []);
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
    mutationFn: (input: { name: string; organizerName: string }) => createEvent(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}
