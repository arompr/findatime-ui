import { Link } from "@tanstack/react-router";
import { messageFor } from "@/lib/errors";
import { useEventByPublicId } from "@/features/home/event-queries";
import { ShareLinkButton } from "./components/ShareLinkButton";
import { AvailabilityWeek } from "./AvailabilityWeek";

type EventPageProps = {
  publicId: string;
};

export function EventPage({ publicId }: EventPageProps) {
  const eventQuery = useEventByPublicId(publicId);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-4 py-8">
      <Link
        to="/"
        className="mb-6 text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
      >
        Back
      </Link>

      {eventQuery.isPending ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : eventQuery.isError ? (
        <p className="text-sm text-slate-500">
          {messageFor(eventQuery.error, "No event found.")}
        </p>
      ) : (
        <>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {eventQuery.data.name}
            </h1>
            <div className="mt-6">
              <ShareLinkButton publicId={publicId} />
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-900">
              Your availability
            </h2>
            <AvailabilityWeek publicId={publicId} />
          </div>
        </>
      )}
    </main>
  );
}
