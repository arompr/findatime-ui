import { formatDayLabel, formatTimeRange } from "@/lib/time";

export type DayWindow = {
  startMs: number;
  endMs: number;
  count: number;
  names: string[];
};

type DayDetailsProps = {
  dayStartMs: number;
  total: number;
  windows: DayWindow[];
};

/** Month-view "who's free that day" card (read mode). */
export function DayDetails({ dayStartMs, total, windows }: DayDetailsProps) {
  return (
    <div className="w-64 p-3">
      <p className="text-xs text-muted-foreground">{formatDayLabel(dayStartMs)}</p>
      <p className="mt-1 text-sm font-semibold">
        {windows.length === 0 ? "No one is free" : "Best times"}
      </p>
      {windows.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2">
          {windows.map((window) => (
            <li key={window.startMs} className="text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium tabular-nums">
                  {formatTimeRange(window.startMs, window.endMs)}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {window.count} of {total}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{window.names.join(", ")}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
        Click to open this week
      </p>
    </div>
  );
}
