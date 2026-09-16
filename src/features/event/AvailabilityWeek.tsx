import { useCallback, useMemo } from "react";
import { useSyncExternalStore } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { IlamyCalendar } from "@ilamy/calendar";
import type { CalendarEvent, CellInfo, IlamyCalendarProps } from "@ilamy/calendar";
import { dragToCreatePlugin } from "@ilamy/calendar/plugins/drag-to-create";
import { Trash2 } from "lucide-react";
import {
  addSelections,
  getSelections,
  removeSelection,
  subscribeAvailability,
  type AvailabilitySelectionInput,
} from "@/lib/availability";
import { buildDensitySegments } from "@/lib/availability-density";
import { getOtherAvailability } from "./otherAvailability";
import { availabilityResizePlugin } from "./availabilityResizePlugin";
import { CalendarHeader } from "./components/CalendarHeader";

type AvailabilityWeekProps = {
  publicId: string;
};

const DAY_START_MINUTES = 9 * 60;
const DAY_END_MINUTES = 17 * 60;

function toClock(minutes: number): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

function useSelections(publicId: string) {
  return useSyncExternalStore(subscribeAvailability, () => getSelections(publicId));
}

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

type AvailabilityBlockProps = {
  id: string;
  startUtc: string;
  endUtc: string;
  onDelete: () => void;
};

function AvailabilityBlock({ id, startUtc, endUtc, onDelete }: AvailabilityBlockProps) {
  return (
    <div
      className="group relative h-full w-full [--spacing:0.25rem] cursor-grab rounded-sm border border-green-600 bg-green-500/20 transition-colors hover:border-green-700"
      data-availability-id={id}
      data-availability-start={startUtc}
      data-availability-end={endUtc}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[2px] flex justify-center opacity-0 transition-opacity group-hover:opacity-100"
      >
        <span className="h-[3px] w-6 rounded-full bg-green-700" />
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[2px] flex justify-center opacity-0 transition-opacity group-hover:opacity-100"
      >
        <span className="h-[3px] w-6 rounded-full bg-green-700" />
      </span>
      <span
        aria-hidden="true"
        className="group/top absolute inset-x-0 top-0 h-2 max-h-[33%] cursor-ns-resize"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] rounded-b-sm bg-green-700 opacity-0 transition-opacity group-hover/top:opacity-100" />
      </span>
      <span
        aria-hidden="true"
        className="group/bottom absolute inset-x-0 bottom-0 h-2 max-h-[33%] cursor-ns-resize"
      >
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] rounded-t-sm bg-green-700 opacity-0 transition-opacity group-hover/bottom:opacity-100" />
      </span>
      <button
        type="button"
        aria-label="Delete availability"
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          onDelete();
        }}
        className="absolute right-[2px] top-[2px] cursor-pointer rounded-sm bg-green-600/90 p-[2px] text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-green-700 pointer-events-none group-hover:pointer-events-auto"
      >
        <Trash2 className="h-[12px] w-[12px]" />
      </button>
    </div>
  );
}

type DensitySegmentMs = {
  startMs: number;
  endMs: number;
  count: number;
};

function densityAt(segments: DensitySegmentMs[], timeMs: number): number {
  let low = 0;
  let high = segments.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const segment = segments[mid];
    if (timeMs < segment.startMs) {
      high = mid - 1;
    } else if (timeMs >= segment.endMs) {
      low = mid + 1;
    } else {
      return segment.count;
    }
  }
  return 0;
}

export function AvailabilityWeek({ publicId }: AvailabilityWeekProps) {
  const selections = useSelections(publicId);

  const committedEvents: NonNullable<IlamyCalendarProps["events"]> = useMemo(
    () =>
      selections.map((selection) => ({
        id: selection.id,
        title: "",
        start: selection.startUtc,
        end: selection.endUtc,
      })),
    [selections],
  );

  const densitySegments = useMemo(
    () =>
      buildDensitySegments(getOtherAvailability()).map((segment) => ({
        startMs: dayjs(segment.startUtc).valueOf(),
        endMs: dayjs(segment.endUtc).valueOf(),
        count: segment.count,
      })),
    [],
  );

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

  const plugins = useMemo(
    () => [
      dragToCreatePlugin({
        onSelect: (selection) => {
          addSelections(publicId, rangeToSelections(selection.start, selection.end));
        },
      }),
      availabilityResizePlugin({
        publicId,
        slotDurationMinutes: 15,
        dayStartMinutes: DAY_START_MINUTES,
        dayEndMinutes: DAY_END_MINUTES,
      }),
    ],
    [publicId],
  );

  const handleCellClick = useCallback(
    (info: CellInfo) => {
      addSelections(publicId, [
        { startUtc: info.start.toISOString(), endUtc: info.end.toISOString() },
      ]);
    },
    [publicId],
  );

  return (
    <div className="h-[560px]">
      <IlamyCalendar
        events={committedEvents}
        renderEvent={renderEvent}
        getCellClassName={getCellClassName}
        plugins={plugins}
        onCellClick={handleCellClick}
        headerComponent={<CalendarHeader />}
        initialView="week"
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
  );
}
