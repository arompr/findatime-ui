import { formatShortTime, formatTimeRange } from "@/lib/time";

type MonthRangeChipProps = {
  startMs: number;
  endMs: number;
  /** Narrow (phone) cells: show only the start time. */
  compact?: boolean;
  onClick: () => void;
};

/** One of the current user's ranges in month view (edit mode). */
export function MonthRangeChip({
  startMs,
  endMs,
  compact = false,
  onClick,
}: MonthRangeChipProps) {
  const label = formatTimeRange(startMs, endMs);
  return (
    <div className="h-full px-1 [--spacing:0.25rem]">
      <button
        type="button"
        aria-label={`Available ${label}. Edit this day`}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        className={`flex h-full w-full cursor-pointer items-center truncate rounded-md border border-foreground/50 bg-card/80 text-left font-medium tabular-nums text-foreground shadow-xs transition-[background-color,transform] hover:bg-card active:scale-[0.97] animate-in fade-in zoom-in-95 duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          compact ? "justify-center px-0.5 text-[10px]" : "px-1.5 text-[11px]"
        }`}
      >
        <span className="truncate">{compact ? formatShortTime(startMs) : label}</span>
      </button>
    </div>
  );
}

type MonthSummaryChipProps = {
  dayStartMs: number;
  dayEndMs: number;
  startMs: number;
  endMs: number;
  count: number;
  total: number;
  /** Narrow (phone) cells: show only the overlap count. */
  compact?: boolean;
  onClick: () => void;
};

/**
 * A day's best overlap in month view (read mode). Carries the day's
 * data-start/data-end so hovering it inspects the day like the cell does.
 */
export function MonthSummaryChip({
  dayStartMs,
  dayEndMs,
  startMs,
  endMs,
  count,
  total,
  compact = false,
  onClick,
}: MonthSummaryChipProps) {
  const label = formatTimeRange(startMs, endMs);
  const everyone = count === total && total > 1;
  return (
    <div className="h-full px-1 [--spacing:0.25rem]">
      <button
        type="button"
        data-start={new Date(dayStartMs).toISOString()}
        data-end={new Date(dayEndMs).toISOString()}
        aria-label={`${count} of ${total} free ${label}. Open this ${compact ? "day" : "week"}`}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        className={`flex h-full w-full cursor-pointer items-center gap-1 rounded-md bg-card/85 ${compact ? "px-0.5" : "px-1.5"} text-left text-[11px] font-medium tabular-nums text-foreground shadow-xs transition-[background-color,transform] hover:bg-card active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
      >
        {!compact && <span className="min-w-0 truncate">{label}</span>}
        <span
          className={`${compact ? "mx-auto" : "ml-auto"} shrink-0 rounded px-1 text-[10px] font-semibold ${
            everyone
              ? "bg-success/15 text-success"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {count}/{total}
        </span>
      </button>
    </div>
  );
}
