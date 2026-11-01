import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { isNotJoined, messageFor } from "@/lib/errors";
import { intervalLabel, toIntervalMinutes } from "@/lib/intervals";
import {
  useEventByPublicId,
  useIsOrganizer,
  useJoinEvent,
  useLeaveEvent,
  useMyParticipant,
  useUpdateEventParams,
} from "./queries";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { EventSettingsModal } from "./components/EventSettingsModal";
import { JoinEventForm } from "./components/JoinEventForm";
import { ParticipantBar } from "./components/ParticipantBar";
import { ShareLinkButton } from "./components/ShareLinkButton";

type EventPageProps = {
  publicId: string;
};

function PageSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="h-28 rounded-lg bg-slate-200/70" />
      <div className="mt-4 h-[65dvh] min-h-[420px] rounded-lg bg-slate-200/70 sm:mt-8 sm:h-[560px] sm:min-h-0" />
    </div>
  );
}

export function EventPage({ publicId }: EventPageProps) {
  const eventQuery = useEventByPublicId(publicId);
  const participantQuery = useMyParticipant(publicId);
  const organizerQuery = useIsOrganizer(publicId);
  const joinMutation = useJoinEvent();
  const leaveMutation = useLeaveEvent();
  const updateParamsMutation = useUpdateEventParams();
  const [showSettings, setShowSettings] = useState(false);

  const participant = participantQuery.data;
  const event = eventQuery.data;
  const eventName = event?.name;
  const intervalMinutes = toIntervalMinutes(event?.intervalMinutes);
  const isOrganizer = organizerQuery.data === true;

  let content: ReactNode;
  if (eventQuery.isPending || participantQuery.isPending) {
    content = <PageSkeleton />;
  } else if (eventQuery.isError) {
    content = (
      <p className="text-sm text-slate-500">
        {messageFor(eventQuery.error, "No event found.")}
      </p>
    );
  } else if (isNotJoined(participantQuery.error)) {
    content = (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {eventName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your name to join and share when you're free.
        </p>
        <div className="mt-5">
          <JoinEventForm
            loading={joinMutation.isPending}
            error={
              joinMutation.isError
                ? messageFor(joinMutation.error, "Could not join the event.")
                : undefined
            }
            onSubmit={(name) => joinMutation.mutate({ publicId, name })}
          />
        </div>
      </div>
    );
  } else if (participantQuery.isError || participant === undefined || eventName === undefined) {
    content = (
      <p className="text-sm text-slate-500">
        {messageFor(participantQuery.error, "Something went wrong.")}
      </p>
    );
  } else {
    content = (
      <>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {eventName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {intervalLabel(intervalMinutes)} time slots
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:items-start sm:justify-between">
            <ParticipantBar
              name={participant.name}
              leaving={leaveMutation.isPending}
              error={
                leaveMutation.isError
                  ? messageFor(leaveMutation.error, "Could not leave the event.")
                  : undefined
              }
              onLeave={() => leaveMutation.mutate(publicId)}
            />
            <div className="flex flex-wrap gap-2 self-start">
              <ShareLinkButton publicId={publicId} />
              {isOrganizer && (
                <button
                  type="button"
                  onClick={() => {
                    updateParamsMutation.reset();
                    setShowSettings(true);
                  }}
                  className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Settings className="size-4" aria-hidden />
                  Settings
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:mt-8 sm:p-6">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-900">
            Your availability
          </h2>
          <AvailabilityCalendar
            publicId={publicId}
            participantId={participant.participantId}
            intervalMinutes={intervalMinutes}
          />
        </div>

        {showSettings && event && (
          <EventSettingsModal
            timezone={event.timezone}
            intervalMinutes={intervalMinutes}
            loading={updateParamsMutation.isPending}
            error={
              updateParamsMutation.isError
                ? messageFor(updateParamsMutation.error, "Could not save event settings.")
                : undefined
            }
            onClose={() => setShowSettings(false)}
            onSave={(input) =>
              updateParamsMutation.mutate(
                { publicId, ...input },
                { onSuccess: () => setShowSettings(false) },
              )
            }
          />
        )}
      </>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-3 py-4 sm:px-4 sm:py-8">
      <Link
        to="/"
        className="mb-4 inline-flex min-h-10 w-fit items-center text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
      >
        Back
      </Link>
      {content}
    </main>
  );
}
