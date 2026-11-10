import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEvent, searchEvents } from "@/lib/api";
import { eventKeys } from "@/features/event/queries";

export function useMyEvents() {
  return useQuery({
    queryKey: eventKeys.mine(),
    queryFn: searchEvents,
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
