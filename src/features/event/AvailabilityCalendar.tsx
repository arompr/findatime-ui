import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MutableRefObject,
  type ReactNode,
} from "react";
import dayjs, { type Dayjs } from "dayjs";
import { IlamyCalendar, useIlamyCalendarContext } from "@ilamy/calendar";
import type {
  CalendarEvent,
  CellInfo,
  EventFormProps,
  IlamyCalendarApi,
  IlamyCalendarProps,
  IlamyPlugin,
  OpenEventFormInput,
} from "@ilamy/calendar";
import { dragToCreatePlugin } from "@ilamy/calendar/plugins/drag-to-create";
import {
  addSelections,
  dayKeyOf,
  getSelections,
  removeSelection,
  replaceDays,
  setSelections,
  subscribeAvailability,
  type AvailabilityRange,
  type AvailabilitySelectionInput,
} from "@/lib/availability";
import {
  bestSegments,
  buildDensitySegments,
  dayPeaks,
  dayWindows,
  densityAt,
  namesFreeAt,
} from "@/lib/availability-density";
import { messageFor } from "@/lib/errors";
import type { IntervalMinutes } from "@/lib/intervals";
import { Popover } from "@/components/ui/Popover";
import { ErrorText } from "@/components/ui/ErrorText";
import { useIsMobile, useIsTouch } from "@/hooks/useMediaQuery";
import { useEventAvailabilities, useSetAvailability } from "./queries";
import { availabilityResizePlugin, blockGestureJustEnded } from "./availabilityResizePlugin";
import { periodTransitionPlugin, swipeNavigationPlugin } from "./swipeNavigationPlugin";
import { pressFeedbackPlugin } from "./pressFeedbackPlugin";
import { AvailabilityBlock } from "./components/AvailabilityBlock";
import { CalendarHeader } from "./components/CalendarHeader";
import {
  AvailabilityToolbar,
  EditHint,
  MobileSaveBar,
  type AvailabilityMode,
} from "./components/AvailabilityActions";
import { ResponsesSummary, type ParticipantStatus } from "./components/ResponsesSummary";
import { SlotDetails } from "./components/SlotDetails";
import { DayDetails, type DayWindow } from "./components/DayDetails";
import { DayAvailabilityForm, type DayTimeRange } from "./components/DayAvailabilityForm";
import { MonthRangeChip, MonthSummaryChip } from "./components/MonthDayChip";

type AvailabilityCalendarProps = {
  publicId: string;
  participantId: string;
  intervalMinutes: IntervalMinutes;
};

type SlotInspection = {
  rect: DOMRect;
  startMs: number;
  endMs: number;
  /** Hover popovers must not catch the pointer, or they'd flicker. */
  hover: boolean;
  /** A whole-day month cell rather than a time slot. */
  day: boolean;
};

type CalendarControls = Pick<IlamyCalendarApi, "setCurrentDate" | "setView" | "openEventForm">;

type MonthEventData =
  | { kind: "range" }
  | { kind: "summary"; dayStartMs: number; dayEndMs: number; count: number };

const DAY_START_MINUTES = 9 * 60;
const DAY_END_MINUTES = 17 * 60;
const CALENDAR_HEIGHT_CLASS = "h-[62dvh] min-h-[420px] sm:h-[600px] sm:min-h-0";
const HOVER_INSPECT_DELAY_MS = 250;
const SAVED_FLASH_MS = 2500;
const MAX_FORM_DAYS = 42;
const MONTH_EVENT_HEIGHT = 20;
const MONTH_MAX_EVENTS = 2;

function toClock(minutes: number): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

function useSelections(publicId: string) {
  return useSyncExternalStore(subscribeAvailability, () => getSelections(publicId));
}

function rangesKey(ranges: AvailabilityRange[]): string {
  return ranges
    .map((range) => `${Date.parse(range.startUtc)}-${Date.parse(range.endUtc)}`)
    .sort()
    .join(",");
}

/**
 * Lets code outside the calendar tree (best-time chips, month chips, cell
 * callbacks) drive the calendar. The plugin's provider renders inside ilamy's
 * context and publishes its controls into this ref.
 */
const NavigatorContext = createContext<MutableRefObject<CalendarControls | null> | null>(null);

function NavigatorProvider({ children }: { children: ReactNode }) {
  const { setCurrentDate, setView, openEventForm } = useIlamyCalendarContext();
  const ref = useContext(NavigatorContext);
  useEffect(() => {
    if (!ref) return;
    ref.current = { setCurrentDate, setView, openEventForm };
    return () => {
      ref.current = null;
    };
  }, [ref, setCurrentDate, setView, openEventForm]);
  return <>{children}</>;
}

/** The local days covered by a month-view selection ([start, end) at midnight). */
function daysBetween(start: Dayjs, end: Dayjs): Dayjs[] {
  const first = start.startOf("day");
  const last = end.subtract(1, "millisecond").startOf("day");
  const days: Dayjs[] = [];
  let day = first;
  while (!day.isAfter(last) && days.length < MAX_FORM_DAYS) {
    days.push(day);
    day = day.add(1, "day");
  }
  return days.length > 0 ? days : [first];
}

function isWholeDay(start: Dayjs, end: Dayjs): boolean {
  return end.diff(start, "hour") >= 20;
}

const navigatorPlugin: IlamyPlugin = { name: "navigator", provider: NavigatorProvider };
const transitionPlugin = periodTransitionPlugin();
const swipePlugin = swipeNavigationPlugin();
const touchFeedbackPlugin = pressFeedbackPlugin();

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

export function AvailabilityCalendar({
  publicId,
  participantId,
  intervalMinutes,
}: AvailabilityCalendarProps) {
  const isMobile = useIsMobile();
  const isTouch = useIsTouch();
  const selections = useSelections(publicId);
  const availabilitiesQuery = useEventAvailabilities(publicId);
  const saveMutation = useSetAvailability();

  const [mode, setMode] = useState<AvailabilityMode | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [inspection, setInspection] = useState<SlotInspection | null>(null);
  const [calendarView, setCalendarView] = useState<string>(isMobile ? "day" : "week");
  const navigatorRef = useRef<CalendarControls | null>(null);
  const lastPointerTypeRef = useRef<string>("mouse");
  const hoverTimerRef = useRef<number | null>(null);

  const data = availabilitiesQuery.data;
  const me = useMemo(
    () => data?.participants.find((p) => p.participantId === participantId),
    [data, participantId],
  );
  const others = useMemo(
    () => data?.participants.filter((p) => p.participantId !== participantId) ?? [],
    [data, participantId],
  );
  const serverRanges = useMemo(() => me?.ranges ?? [], [me]);
  const hasServerRanges = serverRanges.length > 0;

  // Seed the local draft from the server on first load; afterwards keep it in
  // sync only while in read mode, so refetches (window focus) surface changes
  // without ever clobbering an edit in progress.
  useEffect(() => {
    if (data === undefined) return;
    if (mode === null) {
      setSelections(publicId, serverRanges);
      setMode(serverRanges.length > 0 ? "read" : "edit");
    } else if (mode === "read") {
      setSelections(publicId, serverRanges);
    }
  }, [mode, data, serverRanges, publicId]);

  useEffect(() => {
    if (!justSaved) return;
    const timer = window.setTimeout(() => setJustSaved(false), SAVED_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [justSaved]);

  useEffect(() => {
    if (selectedId === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  useEffect(
    () => () => {
      if (hoverTimerRef.current !== null) window.clearTimeout(hoverTimerRef.current);
    },
    [],
  );

  // The calendar remounts (fresh initialView) when the breakpoint flips.
  useEffect(() => {
    setCalendarView(isMobile ? "day" : "week");
  }, [isMobile]);

  const isMonth = calendarView === "month";

  const selectedExists = selectedId !== null && selections.some((s) => s.id === selectedId);
  const activeSelectedId = selectedExists ? selectedId : null;

  const dirty = useMemo(
    () => mode === "edit" && rangesKey(selections) !== rangesKey(serverRanges),
    [mode, selections, serverRanges],
  );

  const everyone = useMemo(
    () => [
      ...others.map((participant) => ({
        id: participant.participantId,
        name: participant.name,
        ranges: participant.ranges,
        isMe: false,
      })),
      {
        id: participantId,
        name: me?.name ?? "You",
        ranges: mode === "edit" ? serverRanges : selections,
        isMe: true,
      },
    ],
    [others, participantId, me, mode, serverRanges, selections],
  );

  const densitySegments = useMemo(
    () => buildDensitySegments(mode === "read" ? everyone : others),
    [everyone, others, mode],
  );

  const peaks = useMemo(() => dayPeaks(densitySegments), [densitySegments]);

  const calendarEvents: NonNullable<IlamyCalendarProps["events"]> = useMemo(() => {
    if (mode === "edit") {
      return selections.map((selection) => ({
        id: selection.id,
        title: "",
        start: selection.startUtc,
        end: selection.endUtc,
        data: isMonth ? { kind: "range" } : undefined,
      }));
    }
    if (!isMonth) return [];
    return [...peaks.entries()].map(([key, peak]) => {
      const dayStart = dayjs(key);
      const data: MonthEventData = {
        kind: "summary",
        dayStartMs: dayStart.valueOf(),
        dayEndMs: dayStart.add(1, "day").valueOf(),
        count: peak.count,
      };
      return { id: `day-${key}`, title: "", start: peak.startMs, end: peak.endMs, data };
    });
  }, [mode, isMonth, selections, peaks]);

  const bestTimes = useMemo(
    () => bestSegments(buildDensitySegments(everyone), Date.now()),
    [everyone],
  );

  const participantStatuses: ParticipantStatus[] = useMemo(
    () =>
      [...everyone]
        .sort((a, b) => Number(b.isMe) - Number(a.isMe))
        .map((participant) => ({
          id: participant.id,
          name: participant.name,
          responded: participant.ranges.length > 0,
          isMe: participant.isMe,
        })),
    [everyone],
  );

  const markedDays = useMemo(() => {
    const days = new Set<string>();
    const ranges = [...others.flatMap((participant) => participant.ranges), ...selections];
    for (const range of ranges) days.add(dayjs(range.startUtc).format("YYYY-MM-DD"));
    return days;
  }, [others, selections]);

  const getCellClassName = useCallback(
    (info: CellInfo) => {
      const count = isWholeDay(info.start, info.end)
        ? (peaks.get(info.start.format("YYYY-MM-DD"))?.count ?? 0)
        : densityAt(densitySegments, info.start.valueOf());
      return count > 0 ? `findatime-heat-${Math.min(count, 4)}` : "";
    },
    [densitySegments, peaks],
  );

  const openWeek = useCallback((date: Dayjs) => {
    setInspection(null);
    navigatorRef.current?.setView("week", date);
  }, []);

  const openDayForm = useCallback((date: Dayjs) => {
    const start = date.startOf("day");
    navigatorRef.current?.openEventForm({ start, end: start.add(1, "day"), allDay: true });
  }, []);

  const handleViewChange = useCallback((view: string) => {
    setCalendarView(view);
    setSelectedId(null);
    setInspection(null);
  }, []);

  const handleSelectBlock = useCallback((id: string) => {
    if (blockGestureJustEnded()) return;
    setSelectedId((current) => (current === id ? null : id));
  }, []);

  const handleActivateBlock = useCallback((id: string) => setSelectedId(id), []);

  const total = everyone.length;

  const renderEvent = useCallback(
    (event: CalendarEvent) => {
      const data = event.data as MonthEventData | undefined;
      if (data?.kind === "summary") {
        return (
          <MonthSummaryChip
            dayStartMs={data.dayStartMs}
            dayEndMs={data.dayEndMs}
            startMs={event.start.valueOf()}
            endMs={event.end.valueOf()}
            count={data.count}
            total={total}
            onClick={() => openWeek(dayjs(data.dayStartMs))}
          />
        );
      }
      if (data?.kind === "range") {
        return (
          <MonthRangeChip
            startMs={event.start.valueOf()}
            endMs={event.end.valueOf()}
            onClick={() => openDayForm(event.start)}
          />
        );
      }
      const id = String(event.id);
      return (
        <AvailabilityBlock
          id={id}
          startUtc={event.start.toISOString()}
          endUtc={event.end.toISOString()}
          selected={id === activeSelectedId}
          onSelect={() => handleSelectBlock(id)}
          onDelete={() => {
            navigator.vibrate?.(8);
            removeSelection(publicId, id);
          }}
        />
      );
    },
    [publicId, activeSelectedId, handleSelectBlock, total, openWeek, openDayForm],
  );

  const plugins = useMemo(() => {
    const list: IlamyPlugin[] = [navigatorPlugin, transitionPlugin];
    if (isMobile) list.push(swipePlugin);
    if (mode === "edit" && isMonth) {
      list.push(
        dragToCreatePlugin({
          onSelect: (selection, openEventForm: (input: OpenEventFormInput) => void) => {
            openEventForm({ start: selection.start, end: selection.end, allDay: true });
            flushStaleClickGuard();
          },
        }),
      );
    } else if (mode === "edit") {
      if (isTouch) list.push(touchFeedbackPlugin);
      list.push(
        dragToCreatePlugin({
          onSelect: (selection) => {
            setSelectedId(null);
            addSelections(publicId, rangeToSelections(selection.start, selection.end));
            flushStaleClickGuard();
          },
        }),
        availabilityResizePlugin({
          publicId,
          slotDurationMinutes: intervalMinutes,
          dayStartMinutes: DAY_START_MINUTES,
          dayEndMinutes: DAY_END_MINUTES,
          onActivate: handleActivateBlock,
        }),
      );
    }
    return list;
  }, [intervalMinutes, isMobile, isTouch, isMonth, mode, publicId, handleActivateBlock]);

  const handleCellClick = useCallback(
    (info: CellInfo) => {
      if (activeSelectedId !== null) {
        setSelectedId(null);
        return;
      }
      addSelections(publicId, [
        { startUtc: info.start.toISOString(), endUtc: info.end.toISOString() },
      ]);
    },
    [publicId, activeSelectedId],
  );

  const renderEventForm = useCallback(
    ({ open, selectedEvent, onClose }: EventFormProps) => {
      if (!open || !selectedEvent || mode !== "edit") return null;
      const days = daysBetween(selectedEvent.start, selectedEvent.end);
      const dayKeys = days.map((day) => day.format("YYYY-MM-DD"));
      const onDays = selections.filter((selection) => dayKeys.includes(dayKeyOf(selection.startUtc)));
      const firstDay = days[0];
      const snap = (minutes: number) =>
        Math.min(
          DAY_END_MINUTES,
          Math.max(DAY_START_MINUTES, Math.round(minutes / intervalMinutes) * intervalMinutes),
        );
      const initialRanges: DayTimeRange[] = onDays
        .filter((selection) => dayKeyOf(selection.startUtc) === dayKeys[0])
        .map((selection) => ({
          start: snap(dayjs(selection.startUtc).diff(firstDay, "minute")),
          end: snap(dayjs(selection.endUtc).diff(firstDay, "minute")),
        }))
        .filter((range) => range.end > range.start)
        .sort((a, b) => a.start - b.start);

      return (
        <DayAvailabilityForm
          key={dayKeys.join(",")}
          days={days}
          initialRanges={
            initialRanges.length > 0
              ? initialRanges
              : [{ start: DAY_START_MINUTES, end: DAY_END_MINUTES }]
          }
          hasExisting={onDays.length > 0}
          slotMinutes={intervalMinutes}
          dayStartMinutes={DAY_START_MINUTES}
          dayEndMinutes={DAY_END_MINUTES}
          onClose={onClose}
          onApply={(ranges) => {
            replaceDays(
              publicId,
              dayKeys,
              days.flatMap((day) =>
                ranges.map((range) => ({
                  startUtc: day.add(range.start, "minute").toISOString(),
                  endUtc: day.add(range.end, "minute").toISOString(),
                })),
              ),
            );
            navigator.vibrate?.(8);
            onClose();
          }}
        />
      );
    },
    [mode, selections, intervalMinutes, publicId],
  );

  const inspectCell = (target: EventTarget | null, hover: boolean): SlotInspection | null => {
    if (!(target instanceof Element)) return null;
    const cell = target.closest<HTMLElement>("[data-start][data-end]");
    if (!cell || cell.dataset.allDay === "true" || cell.dataset.disabled === "true") return null;
    const startMs = Date.parse(cell.dataset.start ?? "");
    const endMs = Date.parse(cell.dataset.end ?? "");
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
    const day = isWholeDay(dayjs(startMs), dayjs(endMs));
    return { rect: cell.getBoundingClientRect(), startMs, endMs, hover, day };
  };

  const clearHoverTimer = () => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const anyoneResponded = everyone.some((participant) => participant.ranges.length > 0);
  const canInspect = mode === "read" && anyoneResponded;

  const inspectionContent = useMemo(() => {
    if (!inspection) return null;
    const named = everyone.map((participant) => ({
      ...participant,
      name: participant.isMe ? "You" : participant.name,
    }));
    if (inspection.day) {
      const windows: DayWindow[] = dayWindows(densitySegments, inspection.startMs).map(
        (window) => ({ ...window, names: namesFreeAt(named, window.startMs) }),
      );
      if (windows.length === 0) return null;
      return <DayDetails dayStartMs={inspection.startMs} total={total} windows={windows} />;
    }
    const free = namesFreeAt(named, inspection.startMs);
    const busy = named.map((participant) => participant.name).filter((name) => !free.includes(name));
    return (
      <SlotDetails startMs={inspection.startMs} endMs={inspection.endMs} free={free} busy={busy} />
    );
  }, [inspection, everyone, densitySegments, total]);

  const handleEdit = () => {
    saveMutation.reset();
    setInspection(null);
    setJustSaved(false);
    setMode("edit");
  };

  const handleCancel = () => {
    setSelections(publicId, serverRanges);
    setSelectedId(null);
    saveMutation.reset();
    if (hasServerRanges) setMode("read");
  };

  const handleSave = () => {
    setSelectedId(null);
    if (!dirty) {
      setMode("read");
      return;
    }
    saveMutation.mutate(
      { publicId, participantId, ranges: selections },
      {
        onSuccess: () => {
          navigator.vibrate?.([6, 40, 10]);
          setJustSaved(true);
          setMode("read");
        },
      },
    );
  };

  if (availabilitiesQuery.isError) {
    return (
      <ErrorText message={messageFor(availabilitiesQuery.error, "Could not load availability.")} />
    );
  }

  if (mode === null) {
    return (
      <div className="animate-pulse rounded-2xl border border-border bg-card p-4 sm:p-5" aria-hidden>
        <div className="mb-4 flex justify-between">
          <div className="h-6 w-44 rounded-md bg-secondary" />
          <div className="h-9 w-24 rounded-lg bg-secondary" />
        </div>
        <div className={`rounded-xl bg-secondary ${CALENDAR_HEIGHT_CLASS}`} />
      </div>
    );
  }

  const saveError = saveMutation.isError
    ? messageFor(saveMutation.error, "Could not save your availability.")
    : undefined;

  const toolbarProps = {
    mode,
    dirty,
    saving: saveMutation.isPending,
    justSaved,
    canCancel: hasServerRanges || dirty,
    onEdit: handleEdit,
    onCancel: handleCancel,
    onSave: handleSave,
  };

  return (
    <NavigatorContext.Provider value={navigatorRef}>
      <section
        className={`rounded-2xl border bg-card p-3 shadow-[var(--shadow-soft)] transition-[border-color,box-shadow] duration-300 sm:p-5 ${
          mode === "edit" ? "border-brand/40 ring-4 ring-brand/8" : "border-border"
        }`}
        aria-label="Availability calendar"
      >
        <div className="flex flex-col gap-3 px-1 pb-3 sm:px-0">
          <AvailabilityToolbar {...toolbarProps} />
          {mode === "edit" ? (
            <EditHint
              isTouch={isTouch}
              hasSelection={activeSelectedId !== null}
              month={isMonth}
            />
          ) : (
            <ResponsesSummary
              participants={participantStatuses}
              bestTimes={bestTimes}
              onBestTimeClick={(startMs) =>
                isMonth
                  ? openWeek(dayjs(startMs))
                  : navigatorRef.current?.setCurrentDate(dayjs(startMs))
              }
            />
          )}
        </div>

        <div
          className={`findatime-calendar touch-pan-y overscroll-x-contain ${CALENDAR_HEIGHT_CLASS} ${
            mode === "read" && !isMonth ? "findatime-readonly" : ""
          }`}
          onPointerDownCapture={(event) => {
            lastPointerTypeRef.current = event.pointerType;
          }}
          onContextMenu={(event) => {
            // Long-press on touch is a gesture here, never a "right click".
            if (lastPointerTypeRef.current !== "mouse") event.preventDefault();
          }}
          onPointerOver={(event) => {
            if (!canInspect || event.pointerType !== "mouse") return;
            const next = inspectCell(event.target, true);
            if (!next) return;
            clearHoverTimer();
            if (inspection?.hover) {
              setInspection(next);
            } else {
              hoverTimerRef.current = window.setTimeout(
                () => setInspection(next),
                HOVER_INSPECT_DELAY_MS,
              );
            }
          }}
          onPointerLeave={(event) => {
            if (event.pointerType !== "mouse") return;
            clearHoverTimer();
            if (inspection?.hover) setInspection(null);
          }}
          onClick={(event) => {
            if (!canInspect || lastPointerTypeRef.current === "mouse") return;
            const next = inspectCell(event.target, false);
            if (!next || next.day) return;
            navigator.vibrate?.(4);
            setInspection((current) =>
              current && !current.hover && current.startMs === next.startMs ? null : next,
            );
          }}
        >
          <IlamyCalendar
            key={isMobile ? "day" : "week"}
            events={calendarEvents}
            renderEvent={renderEvent}
            getCellClassName={getCellClassName}
            plugins={plugins}
            onCellClick={isMonth ? (mode === "edit" ? undefined : (info) => openWeek(info.start)) : handleCellClick}
            disableCellClick={mode !== "edit" && !isMonth}
            onViewChange={handleViewChange}
            renderEventForm={renderEventForm}
            onMoreEventsClick={(day) => (mode === "edit" ? openDayForm(day) : openWeek(day))}
            dayMaxEvents={MONTH_MAX_EVENTS}
            eventHeight={MONTH_EVENT_HEIGHT}
            headerComponent={<CalendarHeader markedDays={markedDays} />}
            initialView={isMobile ? "day" : calendarView}
            firstDayOfWeek="monday"
            slotDuration={intervalMinutes}
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

        {saveError && (
          <div className="mt-3 hidden sm:block">
            <ErrorText message={saveError} />
          </div>
        )}
      </section>

      <MobileSaveBar {...toolbarProps} error={saveError} />
      {mode === "edit" && <div className="h-20 sm:hidden" aria-hidden />}

      <Popover
        open={inspection !== null && inspectionContent !== null}
        anchor={inspection?.rect ?? null}
        onClose={() => setInspection(null)}
        side="top"
        align="center"
        className={inspection?.hover ? "pointer-events-none" : ""}
        ignoreOutside={(target) => target.closest(".findatime-calendar") !== null}
      >
        {inspectionContent}
      </Popover>
    </NavigatorContext.Provider>
  );
}
