import { useIlamyCalendarContext } from "@ilamy/calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";

const views = [
  { name: "week", label: "week" },
  { name: "month", label: "month" },
] as const;

export function CalendarHeader() {
  const {
    view,
    setView,
    nextPeriod,
    prevPeriod,
    today,
    currentDate,
    currentRange,
    t,
  } = useIlamyCalendarContext();

  const title =
    view === "week"
      ? `${currentRange.start.format("MMM D")} – ${currentRange.end.format("MMM D, YYYY")}`
      : currentDate.format("MMM YYYY");

  return (
    <div className="mb-1 flex shrink-0 items-center justify-between gap-2 p-1">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-white">
          <button
            type="button"
            aria-label={t("previous")}
            onClick={prevPeriod}
            className="inline-flex h-full cursor-pointer items-center rounded-l-lg px-2 text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label={t("next")}
            onClick={nextPeriod}
            className="inline-flex h-full cursor-pointer items-center rounded-r-lg px-2 text-slate-600 hover:bg-slate-100"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={today}
          className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {t("today")}
        </button>
        <span className="truncate text-sm font-semibold text-slate-900">{title}</span>
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
        {views.map((option) => (
          <button
            key={option.name}
            type="button"
            aria-pressed={view === option.name}
            onClick={() => setView(option.name)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium ${
              view === option.name
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {t(option.label)}
          </button>
        ))}
      </div>
    </div>
  );
}
