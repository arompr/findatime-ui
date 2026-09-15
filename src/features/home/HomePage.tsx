import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { messageFor } from "@/lib/errors";
import {
  useCreateEvent,
  useEnsureGuestId,
  useEventByPublicId,
  useJoinEvent,
  useMyEvents,
} from "./event-queries.ts";
import { Button } from "./components/ui/Button";
import { JoinCodeForm } from "./components/JoinCodeForm";
import { JoinDetailsForm } from "./components/JoinDetailsForm";
import { CreateEventModal } from "./components/CreateEventModal";
import { MyEventsSection } from "./components/MyEventsSection";

export function HomePage() {
  const navigate = useNavigate();
  const [publicId, setPublicId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEnsureGuestId();

  const eventQuery = useEventByPublicId(publicId);
  const myEventsQuery = useMyEvents();
  const createMutation = useCreateEvent();
  const joinMutation = useJoinEvent();

  const handleCode = (code: string) => {
    if (code === publicId) {
      void eventQuery.refetch();
    } else {
      setPublicId(code);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-4">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">
        Findatime
      </h1>
      <p className="mb-8 text-center text-sm text-slate-500">
        Pick a time that works for everyone.
      </p>

      <div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {publicId !== null && eventQuery.isSuccess ? (
          <JoinDetailsForm
            eventName={eventQuery.data.name}
            loading={joinMutation.isPending}
            error={
              joinMutation.isError
                ? messageFor(joinMutation.error, "Could not join the event.")
                : undefined
            }
            onBack={() => {
              setPublicId(null);
              joinMutation.reset();
            }}
            onSubmit={(name) => {
              if (publicId === null) return;
              joinMutation.mutate(
                { publicId, name },
                {
                  onSuccess: () => {
                    void navigate({
                      to: "/events/$publicId",
                      params: { publicId },
                    });
                  },
                },
              );
            }}
          />
        ) : (
          <JoinCodeForm
            loading={publicId !== null && eventQuery.isPending}
            error={
              publicId !== null && eventQuery.isError
                ? messageFor(eventQuery.error, "Something went wrong.")
                : undefined
            }
            onSubmit={handleCode}
          />
        )}
      </div>

      <Button
        className="mt-4"
        variant="secondary"
        onClick={() => setShowCreate(true)}
      >
        Create event
      </Button>

      <MyEventsSection
        events={myEventsQuery.data?.events ?? []}
        loading={myEventsQuery.isPending}
        error={
          myEventsQuery.isError
            ? messageFor(myEventsQuery.error, "Could not load your events.")
            : undefined
        }
      />

      {showCreate && (
        <CreateEventModal
          loading={createMutation.isPending}
          error={
            createMutation.isError
              ? messageFor(createMutation.error, "Could not create the event.")
              : undefined
          }
          onClose={() => setShowCreate(false)}
          onSubmit={(name, organizerName) =>
            createMutation.mutate(
              { name, organizerName },
              {
                onSuccess: (data) => {
                  setShowCreate(false);
                  void navigate({
                    to: "/events/$publicId",
                    params: { publicId: data.publicId },
                  });
                },
              },
            )
          }
        />
      )}
    </main>
  );
}
