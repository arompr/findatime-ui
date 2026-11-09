import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CalendarPlus, Link2, Plus, Users } from "lucide-react";
import { messageFor } from "@/lib/errors";
import { useEventByPublicId, useJoinEvent } from "@/features/event/queries";
import { JoinEventForm } from "@/features/event/components/JoinEventForm";
import { Button } from "@/components/ui/Button";
import { useCreateEvent, useEnsureGuestId } from "./queries.ts";
import { JoinCodeForm } from "./components/JoinCodeForm";
import { CreateEventModal } from "./components/CreateEventModal";
import { AiPolicyModal } from "./components/AiPolicyModal";

const STEPS = [
  { icon: CalendarPlus, label: "Create an event" },
  { icon: Link2, label: "Share the link" },
  { icon: Users, label: "See when everyone's free" },
] as const;

/** Accepts a bare code or a pasted event URL (…/events/<code>). */
function parseCode(input: string): string {
  const match = input.match(/\/events\/([^/?#\s]+)/);
  return match ? decodeURIComponent(match[1]) : input;
}

export function HomePage() {
  const navigate = useNavigate();
  const [publicId, setPublicId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAiPolicy, setShowAiPolicy] = useState(false);

  useEnsureGuestId();

  const eventQuery = useEventByPublicId(publicId);
  const createMutation = useCreateEvent();
  const joinMutation = useJoinEvent();

  const handleCode = (input: string) => {
    const code = parseCode(input);
    if (code === publicId) {
      void eventQuery.refetch();
    } else {
      setPublicId(code);
    }
  };

  const joining = publicId !== null && eventQuery.isSuccess;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-[min(12vh,6rem)] sm:px-6">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-balance font-display text-[2rem] font-semibold leading-[1.15] tracking-tight sm:text-[2.5rem]">
          Find a time that works for everyone.
        </h1>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-3 duration-500 sm:p-6">
        {joining ? (
          <div
            key="join"
            className="animate-in fade-in slide-in-from-right-3 duration-300"
          >
            <JoinEventForm
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
          </div>
        ) : (
          <div key="code" className="animate-in fade-in duration-300">
            <JoinCodeForm
              loading={publicId !== null && eventQuery.isPending}
              error={
                publicId !== null && eventQuery.isError
                  ? messageFor(eventQuery.error, "Something went wrong.")
                  : undefined
              }
              onSubmit={handleCode}
            />

            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                createMutation.reset();
                setShowCreate(true);
              }}
            >
              <Plus className="size-4" aria-hidden />
              Create a new event
            </Button>
          </div>
        )}
      </div>

      <ol className="mt-8 grid grid-cols-3 gap-2 text-center animate-in fade-in duration-700">
        {STEPS.map(({ icon: Icon, label }, index) => (
          <li key={label} className="flex flex-col items-center gap-2 px-1">
            <span className="relative inline-flex size-10 items-center justify-center rounded-full bg-secondary text-foreground">
              <Icon className="size-[18px]" aria-hidden />
              <span className="absolute -right-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground">
                {index + 1}
              </span>
            </span>
            <span className="text-xs leading-snug text-muted-foreground">
              {label}
            </span>
          </li>
        ))}
      </ol>

      <footer className="mt-auto flex justify-center pt-10 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => setShowAiPolicy(true)}
          className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg px-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="underline decoration-border underline-offset-4">
            How I use AI
          </span>
        </button>
      </footer>

      {showAiPolicy && <AiPolicyModal onClose={() => setShowAiPolicy(false)} />}

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
