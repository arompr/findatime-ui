import { useMemo, useState, type ReactNode } from "react";
import dayjs from "dayjs";
import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarX2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { isNotJoined, messageFor } from "@/lib/errors";
import { toIntervalMinutes } from "@/lib/intervals";
import {
  DEFAULT_DAY_END_HOUR,
  DEFAULT_DAY_START_HOUR,
  hourLabel,
  localDayWindow,
  toDayHour,
} from "@/lib/dayWindow";
import { browserTimezone, formatTimeRange, timezoneShortName } from "@/lib/time";
import {
  useDeleteEvent,
  useEventByPublicId,
  useIsOrganizer,
  useJoinEvent,
  useLeaveEvent,
  useMyParticipant,
  useUpdateEventParams,
} from "./queries";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { EventHeader } from "./components/EventHeader";
import { EventSettingsModal } from "./components/EventSettingsModal";
import { JoinEventForm } from "./components/JoinEventForm";

type EventPageProps = {
  publicId: string;
};

type Dialog = "settings" | "leave" | "delete" | null;

function PageSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="h-9 w-2/3 rounded-lg bg-secondary" />
      <div className="mt-3 flex gap-1.5">
        <div className="h-7 w-28 rounded-full bg-secondary" />
        <div className="h-7 w-24 rounded-full bg-secondary" />
      </div>
      <div className="mt-6 h-[65dvh] min-h-[420px] rounded-2xl bg-secondary sm:h-[600px] sm:min-h-0" />
    </div>
  );
}

function Notice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto mt-[10vh] flex max-w-sm flex-col items-center text-center animate-in fade-in duration-300">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <CalendarX2 className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">{title}</h1>
      {children && <p className="mt-2 text-sm text-muted-foreground">{children}</p>}
      <Link
        to="/"
        className={`mt-6 inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium transition-[color,outline-offset] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-10 ${buttonVariants.secondary}`}
      >
        Go to the home page
      </Link>
    </div>
  );
}

export function EventPage({ publicId }: EventPageProps) {
  const navigate = useNavigate();
  const eventQuery = useEventByPublicId(publicId);
  const participantQuery = useMyParticipant(publicId);
  const organizerQuery = useIsOrganizer(publicId);
  const joinMutation = useJoinEvent();
  const leaveMutation = useLeaveEvent();
  const updateParamsMutation = useUpdateEventParams();
  const deleteMutation = useDeleteEvent();
  const [dialog, setDialog] = useState<Dialog>(null);

  const participant = participantQuery.data;
  const event = eventQuery.data;
  const eventName = event?.name;
  const intervalMinutes = toIntervalMinutes(event?.intervalMinutes);
  const isOrganizer = organizerQuery.data === true;
  const eventTimezone = event?.timezone ?? null;
  const dayStartHour = toDayHour(event?.dayStartHour, 0, 23, DEFAULT_DAY_START_HOUR);
  const parsedEndHour = toDayHour(event?.dayEndHour, 1, 24, DEFAULT_DAY_END_HOUR);
  const dayEndHour = parsedEndHour > dayStartHour ? parsedEndHour : 24;
  const dayWindow = useMemo(
    () => localDayWindow(dayStartHour, dayEndHour, eventTimezone, intervalMinutes),
    [dayStartHour, dayEndHour, eventTimezone, intervalMinutes],
  );
  const hoursLabel = useMemo(() => {
    const midnight = dayjs().startOf("day");
    return formatTimeRange(
      midnight.add(dayWindow.startMinutes, "minute").valueOf(),
      midnight.add(dayWindow.endMinutes, "minute").valueOf(),
    );
  }, [dayWindow]);
  const eventHoursLabel = useMemo(() => {
    const frame = eventTimezone ?? "UTC";
    if (frame === browserTimezone()) return null;
    return `${hourLabel(dayStartHour)} – ${hourLabel(dayEndHour)} ${timezoneShortName(frame)}`;
  }, [dayStartHour, dayEndHour, eventTimezone]);

  let content: ReactNode;
  if (eventQuery.isPending || participantQuery.isPending) {
    content = <PageSkeleton />;
  } else if (eventQuery.isError) {
    content = (
      <Notice title="Event not found">
        {messageFor(eventQuery.error, "No event found.")} Double-check the link you were sent.
      </Notice>
    );
  } else if (isNotJoined(participantQuery.error)) {
    content = (
      <div className="mx-auto mt-[6vh] w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-2 duration-300 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          You're invited to
        </p>
        <h1 className="mt-1 text-balance font-display text-2xl font-semibold tracking-tight">
          {eventName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add your name, then mark when you're free.
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
      <Notice title="Something went wrong">
        {messageFor(participantQuery.error, "Please try again in a moment.")}
      </Notice>
    );
  } else {
    content = (
      <>
        <EventHeader
          publicId={publicId}
          eventName={eventName}
          participantName={participant.name}
          intervalMinutes={intervalMinutes}
          timezone={eventTimezone}
          hoursLabel={hoursLabel}
          eventHoursLabel={eventHoursLabel}
          isOrganizer={isOrganizer}
          onOpenSettings={() => {
            updateParamsMutation.reset();
            setDialog("settings");
          }}
          onLeave={() => {
            leaveMutation.reset();
            setDialog("leave");
          }}
          onDelete={() => {
            deleteMutation.reset();
            setDialog("delete");
          }}
        />

        <div className="mt-6">
          <AvailabilityCalendar
            publicId={publicId}
            participantId={participant.participantId}
            intervalMinutes={intervalMinutes}
            dayStartMinutes={dayWindow.startMinutes}
            dayEndMinutes={dayWindow.endMinutes}
          />
        </div>

        {dialog === "settings" && event && (
          <EventSettingsModal
            timezone={event.timezone}
            intervalMinutes={intervalMinutes}
            dayStartHour={dayStartHour}
            dayEndHour={dayEndHour}
            loading={updateParamsMutation.isPending}
            error={
              updateParamsMutation.isError
                ? messageFor(updateParamsMutation.error, "Could not save event settings.")
                : undefined
            }
            onClose={() => setDialog(null)}
            onSave={(input) =>
              updateParamsMutation.mutate(
                { publicId, ...input },
                { onSuccess: () => setDialog(null) },
              )
            }
          />
        )}

        {dialog === "leave" && (
          <ConfirmDialog
            title="Leave this event?"
            confirmLabel="Leave event"
            destructive
            loading={leaveMutation.isPending}
            error={
              leaveMutation.isError
                ? messageFor(leaveMutation.error, "Could not leave the event.")
                : undefined
            }
            onCancel={() => setDialog(null)}
            onConfirm={() =>
              leaveMutation.mutate(publicId, { onSuccess: () => setDialog(null) })
            }
          >
            Your availability will be removed from{" "}
            <span className="font-medium text-foreground">{eventName}</span>. You can rejoin
            later with the same link.
          </ConfirmDialog>
        )}

        {dialog === "delete" && (
          <ConfirmDialog
            title="Delete this event?"
            confirmLabel="Delete event"
            destructive
            loading={deleteMutation.isPending}
            error={
              deleteMutation.isError
                ? messageFor(deleteMutation.error, "Could not delete the event.")
                : undefined
            }
            onCancel={() => setDialog(null)}
            onConfirm={() =>
              deleteMutation.mutate(publicId, {
                onSuccess: () => {
                  void navigate({ to: "/" });
                },
              })
            }
          >
            <span className="font-medium text-foreground">{eventName}</span> and everyone's
            availability will be permanently deleted. This can't be undone.
          </ConfirmDialog>
        )}
      </>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-8 pt-2 sm:px-6 sm:pb-12 sm:pt-6">
      {content}
    </main>
  );
}
