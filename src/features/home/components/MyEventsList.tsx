import { Link } from "@tanstack/react-router";
import { ChevronRight, Crown } from "lucide-react";
import type { EventSummaryResponse } from "@arompr/findatime-typescript-client";
import { Tooltip } from "@/components/ui/Tooltip";

type MyEventsListProps = {
  events: EventSummaryResponse[];
  loading: boolean;
  error?: string;
  activePublicId?: string;
  onNavigate: () => void;
};

export function MyEventsList({
  events,
  loading,
  error,
  activePublicId,
  onNavigate,
}: MyEventsListProps) {
  return (
    <div className="flex max-h-[min(24rem,70dvh)] w-[min(20rem,calc(100vw-1rem))] flex-col">
      <p className="px-4 pb-2 pt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Your events
      </p>
      {loading ? (
        <div className="flex flex-col gap-2 px-4 pb-4" aria-hidden>
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-9 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      ) : error ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground">{error}</p>
      ) : events.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground">
          Events you create or join show up here.
        </p>
      ) : (
        <ul className="overflow-y-auto overscroll-contain px-1 pb-1">
          {events.map((event) => {
            const active = event.publicId === activePublicId;
            return (
              <li key={event.publicId}>
                <Link
                  to="/events/$publicId"
                  params={{ publicId: event.publicId }}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none active:scale-[0.99] ${
                    active ? "bg-secondary font-medium" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{event.name}</span>
                  {event.isOrganizer && (
                    <Tooltip content="You organize this event" side="top">
                      <Crown className="size-4 text-brand" aria-label="Organizer" />
                    </Tooltip>
                  )}
                  <ChevronRight
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
