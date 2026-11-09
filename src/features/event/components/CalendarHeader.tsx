import { useIlamyCalendarContext } from "@ilamy/calendar";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { useIsMobile } from "@/hooks/useMediaQuery";

const views = [
  { name: "week", label: "Week" },
  { name: "month", label: "Month" },
] as const;

type CalendarHeaderProps = {
  /** Days (YYYY-MM-DD, local) that have any availability, dotted in the mobile week strip. */
  markedDays?: ReadonlySet<string>;
};

function dayTitle(date: Dayjs): string {
  const base = date.format("dddd, MMM D");
  return date.year() === dayjs().year() ? base : `${base}, ${date.year()}`;
}

function PeriodNav({ unit, jumpWeeks = false }: { unit: string; jumpWeeks?: boolean }) {
  const { nextPeriod, prevPeriod, currentDate, setCurrentDate } = useIlamyCalendarContext();
  const prev = jumpWeeks ? () => setCurrentDate(currentDate.subtract(1, "week")) : prevPeriod;
  const next = jumpWeeks ? () => setCurrentDate(currentDate.add(1, "week")) : nextPeriod;
  return (
    <div className="flex items-center gap-1.5">
      <IconButton
        variant="secondary"
        label={`Previous ${unit}`}
        tooltipSide="bottom"
        onClick={prev}
        icon={<ChevronLeft className="size-4" aria-hidden />}
      />
      <IconButton
        variant="secondary"
        label={`Next ${unit}`}
        tooltipSide="bottom"
        onClick={next}
        icon={<ChevronRight className="size-4" aria-hidden />}
      />
    </div>
  );
}

function TodayButton() {
  const { today, currentDate, view } = useIlamyCalendarContext();
  const unit = view === "day" ? "day" : view === "month" ? "month" : "week";
  const isCurrent = currentDate.isSame(dayjs(), unit);
  return (
    <Button variant="secondary" size="sm" onClick={today} disabled={isCurrent}>
      Today
    </Button>
  );
}

function WeekStrip({ markedDays }: CalendarHeaderProps) {
  const { currentDate, setCurrentDate } = useIlamyCalendarContext();
  const weekStart = currentDate.startOf("day").subtract((currentDate.day() + 6) % 7, "day");
  const today = dayjs().startOf("day");
  const days = Array.from({ length: 7 }, (_, index) => weekStart.add(index, "day"));

  return (
    <div className="grid grid-cols-7 gap-1" role="tablist" aria-label="Days of the week">
      {days.map((day) => {
        const selected = day.isSame(currentDate, "day");
        const isToday = day.isSame(today, "day");
        const marked = markedDays?.has(day.format("YYYY-MM-DD"));
        return (
          <button
            key={day.valueOf()}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={day.format("dddd, MMMM D")}
            onClick={() => setCurrentDate(day)}
            className={`relative flex h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-200 active:scale-95 ${
              selected ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-secondary"
            }`}
          >
            <span
              className={`text-[10px] font-medium uppercase tracking-wide ${
                selected ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}
            >
              {day.format("dd")}
            </span>
            <span
              className={`text-base font-semibold tabular-nums leading-none ${
                isToday && !selected ? "text-brand" : ""
              }`}
            >
              {day.date()}
            </span>
            <span
              aria-hidden
              className={`size-1 rounded-full transition-opacity ${marked ? "opacity-100" : "opacity-0"} ${
                selected ? "bg-primary-foreground" : "bg-brand"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export function CalendarHeader({ markedDays }: CalendarHeaderProps) {
  const { view, setView, currentDate, currentRange } = useIlamyCalendarContext();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="mb-2 flex shrink-0 flex-col gap-3 px-1 pt-1">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-display text-lg font-semibold tracking-tight">
            {dayTitle(currentDate)}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <TodayButton />
            <PeriodNav unit="week" jumpWeeks />
          </div>
        </div>
        <WeekStrip markedDays={markedDays} />
      </div>
    );
  }

  const title =
    view === "week"
      ? currentRange.start.isSame(currentRange.end, "month")
        ? `${currentRange.start.format("MMMM D")} – ${currentRange.end.format("D, YYYY")}`
        : `${currentRange.start.format("MMM D")} – ${currentRange.end.format("MMM D, YYYY")}`
      : currentDate.format("MMMM YYYY");

  return (
    <div className="mb-2 flex shrink-0 items-center justify-between gap-2 p-1">
      <div className="flex min-w-0 items-center gap-2">
        <PeriodNav unit={view === "month" ? "month" : "week"} />
        <TodayButton />
        <span className="ml-1 truncate font-display text-lg font-semibold tracking-tight">{title}</span>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <div
          className="flex items-center gap-0.5 rounded-lg bg-secondary p-0.5"
          role="radiogroup"
          aria-label="Calendar view"
        >
          {views.map((option) => (
            <button
              key={option.name}
              type="button"
              role="radio"
              aria-checked={view === option.name}
              onClick={() => setView(option.name)}
              className={`h-8 cursor-pointer rounded-md px-3 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                view === option.name
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
