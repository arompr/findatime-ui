import { Link } from "@tanstack/react-router";
import type { EventSummaryResponse } from "@arompr/findatime-typescript-client";

type MyEventsSectionProps = {
  events: EventSummaryResponse[];
  loading: boolean;
  error?: string;
};

function Star() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0 text-amber-400"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-label="Organizer"
    >
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
    </svg>
  );
}

export function MyEventsSection({
  events,
  loading,
  error,
}: MyEventsSectionProps) {
  if (loading) {
    return <p className="text-sm text-slate-500">Loading your events…</p>;
  }

  if (error) {
    return <p className="text-sm text-slate-500">{error}</p>;
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 w-full">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        My events
      </h2>
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm">
        {events.map((event) => (
          <li key={event.publicId}>
            <Link
              to="/events/$publicId"
              params={{ publicId: event.publicId }}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="truncate">{event.name}</span>
              {event.isOrganizer && <Star />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
