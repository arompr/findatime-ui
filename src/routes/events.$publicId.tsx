import { createFileRoute } from "@tanstack/react-router";
import { EventPage } from "@/features/event/EventPage";

export const Route = createFileRoute("/events/$publicId")({
  component: EventRoute,
});

function EventRoute() {
  const { publicId } = Route.useParams();
  return <EventPage publicId={publicId} />;
}
