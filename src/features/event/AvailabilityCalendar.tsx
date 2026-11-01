import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Dayjs } from "dayjs";
import { IlamyCalendar } from "@ilamy/calendar";
import type {
  CalendarEvent,
  CellInfo,
  IlamyCalendarProps,
  IlamyPlugin,
} from "@ilamy/calendar";
import { dragToCreatePlugin } from "@ilamy/calendar/plugins/drag-to-create";
import {
  addSelections,
  getSelections,
  removeSelection,
  setSelections,
  subscribeAvailability,
  type AvailabilitySelectionInput,
} from "@/lib/availability";
import { buildDensitySegments, densityAt } from "@/lib/availability-density";
import { messageFor } from "@/lib/errors";
import { useIsMobile, useIsTouch } from "@/hooks/useMediaQuery";
import { useEventAvailabilities, useSetAvailability } from "./queries";
import { availabilityResizePlugin } from "./availabilityResizePlugin";
import { swipeNavigationPlugin } from "./swipeNavigationPlugin";
import { AvailabilityBlock } from "./components/AvailabilityBlock";
import { CalendarHeader } from "./components/CalendarHeader";
import { AvailabilityActions, type AvailabilityMode } from "./components/AvailabilityActions";
import { HeatmapLegend } from "./components/HeatmapLegend";

type AvailabilityCalendarProps = {
  publicId: string;
  participantId: string;
};

const DAY_START_MINUTES = 9 * 60;
const DAY_END_MINUTES = 17 * 60;
const CALENDAR_HEIGHT_CLASS = "h-[65dvh] min-h-[420px] sm:h-[560px] sm:min-h-0";

function toClock(minutes: number): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

function useSelections(publicId: string) {
  return useSyncExternalStore(subscribeAvailability, () => getSelections(publicId));
}

/**
 * drag-to-create ends a drag by arming a one-shot capture-phase click listener
 * on window that swallows the click browsers synthesize after the gesture. On
 * touch, that synthetic click never comes (the plugin cancels touchmove), so
 * the stale listener would eat the user's *next* tap instead. Dispatch an inert
 * click on window shortly after a commit: if the guard is still armed it
 * consumes this and disarms; if a real click already disarmed it, this is a
 * no-op (window-targeted clicks bypass the React tree).
 */
function flushStaleClickGuard(): void {
  window.setTimeout(() => {
    window.dispatchEvent(new MouseEvent("click"));
  }, 150);
}

/**
 * A drag across several day columns becomes one selection per day, keeping the
 * dragged time-of-day range on each.
 */
function rangeToSelections(start: Dayjs, end: Dayjs): AvailabilitySelectionInput[] {
  const anchorDay = start.startOf("day");
  const currentDay = end.startOf("day");
  const firstDay = anchorDay.isBefore(currentDay) ? anchorDay : currentDay;
  const lastDay = anchorDay.isAfter(currentDay) ? anchorDay : currentDay;

  const startMinutes = Math.min(
    start.hour() * 60 + start.minute(),
    end.hour() * 60 + end.minute(),
  );
  const endMinutes = Math.max(
    start.hour() * 60 + start.minute(),
    end.hour() * 60 + end.minute(),
  );

  const selections: AvailabilitySelectionInput[] = [];
  let day = firstDay;
  while (!day.isAfter(lastDay)) {
    const startUtc = day.add(startMinutes, "minute").toISOString();
    const endUtc = day.add(endMinutes, "minute").toISOString();
    selections.push({ startUtc, endUtc });
    day = day.add(1, "day");
  }
  return selections;
}

export function AvailabilityCalendar({ publicId, participantId }: AvailabilityCalendarProps) {
  const isMobile = useIsMobile();
  const isTouch = useIsTouch();
  const selections = useSelections(publicId);
  const availabilitiesQuery = useEventAvailabilities(publicId);
  const saveMutation = useSetAvailability();

  const [mode, setMode] = useState<AvailabilityMode | null>(null);

  const data = availabilitiesQuery.data;
  const me = useMemo(
    () => data?.participants.find((p) => p.participantId === participantId),
    [data, participantId],
  );
  const others = useMemo(
    () => data?.participants.filter((p) => p.participantId !== participantId) ?? [],
    [data, participantId],
  );

  // Seed the local draft from the server on first load; afterwards keep it in
  // sync only while in read mode, so refetches (window focus) surface changes
  // without ever clobbering an edit in progress.
  useEffect(() => {
    if (data === undefined) return;
    const myRanges = me?.ranges ?? [];
    if (mode === null) {
      setSelections(publicId, myRanges);
      setMode(myRanges.length > 0 ? "read" : "edit");
    } else if (mode === "read") {
      setSelections(publicId, myRanges);
    }
  }, [mode, data, me, publicId]);

  const committedEvents: NonNullable<IlamyCalendarProps["events"]> = useMemo(
    () =>
      mode === "edit"
        ? selections.map((selection) => ({
            id: selection.id,
            title: "",
            start: selection.startUtc,
            end: selection.endUtc,
          }))
        : [],
    [mode, selections],
  );

  const densitySegments = useMemo(() => {
    const everyone =
      mode === "read" ? [...others, { ranges: selections }] : others;
    return buildDensitySegments(everyone);
  }, [others, mode, selections]);

  const getCellClassName = useCallback(
    (info: CellInfo) => {
      const count = densityAt(densitySegments, info.start.valueOf());
      return count > 0 ? `findatime-heat-${Math.min(count, 4)}` : "";
    },
    [densitySegments],
  );

  const renderEvent = useCallback(
    (event: CalendarEvent) => (
      <AvailabilityBlock
        id={String(event.id)}
        startUtc={event.start.toISOString()}
        endUtc={event.end.toISOString()}
        onDelete={() => removeSelection(publicId, String(event.id))}
      />
    ),
    [publicId],
  );

  const plugins = useMemo(() => {
    const list: IlamyPlugin[] = [];
    if (isMobile) {
      list.push(swipeNavigationPlugin());
    }
    if (mode === "edit") {
      list.push(
        dragToCreatePlugin({
          onSelect: (selection) => {
            addSelections(publicId, rangeToSelections(selection.start, selection.end));
            flushStaleClickGuard();
          },
        }),
        availabilityResizePlugin({
          publicId,
          slotDurationMinutes: 15,
          dayStartMinutes: DAY_START_MINUTES,
          dayEndMinutes: DAY_END_MINUTES,
        }),
      );
    }
    return list;
  }, [isMobile, mode, publicId]);

  const handleCellClick = useCallback(
    (info: CellInfo) => {
      addSelections(publicId, [
        { startUtc: info.start.toISOString(), endUtc: info.end.toISOString() },
      ]);
    },
    [publicId],
  );

  const handleEdit = () => {
    saveMutation.reset();
    setMode("edit");
  };

  const handleSave = () => {
    saveMutation.mutate(
      { publicId, participantId, ranges: selections },
      {
        onSuccess: () => {
          setMode("read");
        },
      },
    );
  };

  if (availabilitiesQuery.isError) {
    return (
      <p className="text-sm text-slate-500">
        {messageFor(availabilitiesQuery.error, "Could not load availability.")}
      </p>
    );
  }

  if (mode === null) {
    return (
      <div className="animate-pulse" aria-hidden>
        <div className="mb-3 h-10 w-full rounded-lg bg-slate-100" />
        <div className={`rounded-lg bg-slate-100 ${CALENDAR_HEIGHT_CLASS}`} />
      </div>
    );
  }

  const respondedCount = others.filter((p) => p.ranges.length > 0).length;

  return (
    <div>
      <HeatmapLegend respondedCount={respondedCount} />
      <div
        className={`touch-pan-y overscroll-x-contain ${CALENDAR_HEIGHT_CLASS} ${
          mode === "read" ? "findatime-readonly" : ""
        }`}
      >
        <IlamyCalendar
          key={isMobile ? "day" : "week"}
          events={committedEvents}
          renderEvent={renderEvent}
          getCellClassName={getCellClassName}
          plugins={plugins}
          onCellClick={handleCellClick}
          disableCellClick={mode !== "edit"}
          headerComponent={<CalendarHeader />}
          initialView={isMobile ? "day" : "week"}
          firstDayOfWeek="monday"
          slotDuration={15}
          timeFormat="12-hour"
          hiddenDays={[]}
          businessHours={{
            daysOfWeek: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ],
            startTime: toClock(DAY_START_MINUTES),
            endTime: toClock(DAY_END_MINUTES),
          }}
          hideNonBusinessHours
          disableEventClick
          disableDragAndDrop
          eventSpacing={0}
        />
      </div>
      <AvailabilityActions
        mode={mode}
        isTouch={isTouch}
        saving={saveMutation.isPending}
        saved={saveMutation.isSuccess}
        error={
          saveMutation.isError
            ? messageFor(saveMutation.error, "Could not save your availability.")
            : undefined
        }
        onEdit={handleEdit}
        onSave={handleSave}
      />
    </div>
  );
}
