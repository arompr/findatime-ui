import { Check } from "lucide-react";
import { formatDayLabel, formatTimeRange } from "@/lib/time";

type SlotDetailsProps = {
  startMs: number;
  endMs: number;
  free: string[];
  busy: string[];
};

/** "Who's free" card for one calendar slot (read mode). */
export function SlotDetails({ startMs, endMs, free, busy }: SlotDetailsProps) {
  const total = free.length + busy.length;
  return (
    <div className="w-60 p-3">
      <p className="text-xs text-muted-foreground">
        {formatDayLabel(startMs)} · <span className="tabular-nums">{formatTimeRange(startMs, endMs)}</span>
      </p>
      <p className="mt-1 text-sm font-semibold">
        {free.length === 0
          ? "No one is free"
          : free.length === total
            ? "Everyone is free"
            : `${free.length} of ${total} free`}
      </p>
      {free.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {free.map((name, index) => (
            <li key={`${name}-${index}`} className="flex items-center gap-2 text-sm">
              <Check className="size-3.5 shrink-0 text-success" aria-hidden />
              <span className="truncate">{name}</span>
            </li>
          ))}
        </ul>
      )}
      {busy.length > 0 && free.length > 0 && (
        <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
          Not free: {busy.join(", ")}
        </p>
      )}
    </div>
  );
}
