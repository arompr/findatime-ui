import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import { messageFor } from "@/lib/errors";
import { useMyEvents } from "./queries";
import { MyEventsList } from "./components/MyEventsList";

/** Header entry point to the guest's events (create/join history). */
export function MyEventsMenu() {
  const myEventsQuery = useMyEvents();
  const params = useParams({ strict: false });
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  const events = myEventsQuery.data?.events ?? [];
  if (myEventsQuery.isSuccess && events.length === 0) return null;

  return (
    <>
      <Button
        ref={setAnchor}
        variant="secondary"
        size="sm"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="gap-1.5"
      >
        <CalendarDays className="size-4" aria-hidden />
        <span>Your events</span>
        {events.length > 0 && (
          <span className="min-w-5 rounded-full bg-secondary px-1.5 text-xs tabular-nums text-muted-foreground">
            {events.length}
          </span>
        )}
        <ChevronDown
          className={`size-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </Button>
      <Popover open={open} anchor={anchor} onClose={() => setOpen(false)} align="end">
        <MyEventsList
          events={events}
          loading={myEventsQuery.isPending}
          error={
            myEventsQuery.isError
              ? messageFor(myEventsQuery.error, "Could not load your events.")
              : undefined
          }
          activePublicId={params.publicId}
          onNavigate={() => setOpen(false)}
        />
      </Popover>
    </>
  );
}
