import { useCallback, useMemo } from "react";
import { useSyncExternalStore } from "react";
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
import { CalendarHeader } from "./components/CalendarHeader";

type AvailabilityWeekProps = {
  publicId: string;
};

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
  onDelete: () => void;
};

function AvailabilityBlock({ onDelete }: AvailabilityBlockProps) {
  return (
    <div className="group relative h-full w-full rounded-sm border border-green-600 bg-green-500/20">
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

  const renderEvent = useCallback(
    (event: CalendarEvent) => (
      <AvailabilityBlock onDelete={() => removeSelection(publicId, String(event.id))} />
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
          startTime: "09:00",
          endTime: "17:00",
        }}
        hideNonBusinessHours
        disableEventClick
        disableDragAndDrop
        eventSpacing={0}
      />
    </div>
  );
}
