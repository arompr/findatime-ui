import { useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { Plus, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { SelectInput } from "@/components/ui/SelectInput";
import { formatTimeRange } from "@/lib/time";

/** A time range within one day, in minutes from midnight. */
export type DayTimeRange = { start: number; end: number };

type DayAvailabilityFormProps = {
  days: Dayjs[];
  initialRanges: DayTimeRange[];
  /** Whether the days already hold availability (enables "Clear"). */
  hasExisting: boolean;
  slotMinutes: number;
  dayStartMinutes: number;
  dayEndMinutes: number;
  onApply: (ranges: DayTimeRange[]) => void;
  onClose: () => void;
};

function clockLabel(minutes: number): string {
  return dayjs().startOf("day").add(minutes, "minute").format("h:mm A");
}

function daysTitle(days: Dayjs[]): string {
  const first = days[0];
  const last = days[days.length - 1];
  if (days.length === 1) return first.format("dddd, MMM D");
  if (first.month() === last.month()) return `${first.format("MMM D")} – ${last.format("D")}`;
  return `${first.format("MMM D")} – ${last.format("MMM D")}`;
}

/**
 * Edits one or several days' availability as a list of time ranges. Used as
 * the calendar library's event form in month view.
 */
export function DayAvailabilityForm({
  days,
  initialRanges,
  hasExisting,
  slotMinutes,
  dayStartMinutes,
  dayEndMinutes,
  onApply,
  onClose,
}: DayAvailabilityFormProps) {
  const [ranges, setRanges] = useState<DayTimeRange[]>(initialRanges);

  const times = useMemo(() => {
    const list: number[] = [];
    for (let minutes = dayStartMinutes; minutes <= dayEndMinutes; minutes += slotMinutes) {
      list.push(minutes);
    }
    return list;
  }, [dayStartMinutes, dayEndMinutes, slotMinutes]);

  const presets: { label: string; range: DayTimeRange }[] = [
    { label: "Whole day", range: { start: dayStartMinutes, end: dayEndMinutes } },
    { label: "Morning", range: { start: dayStartMinutes, end: Math.min(12 * 60, dayEndMinutes) } },
    { label: "Afternoon", range: { start: Math.max(12 * 60, dayStartMinutes), end: dayEndMinutes } },
  ];

  const lastEnd = ranges.reduce((max, range) => Math.max(max, range.end), dayStartMinutes);
  const canAdd = ranges.length === 0 || lastEnd + slotMinutes <= dayEndMinutes;
  const multiple = days.length > 1;

  const update = (index: number, patch: Partial<DayTimeRange>) => {
    setRanges((current) =>
      current.map((range, i) => {
        if (i !== index) return range;
        const next = { ...range, ...patch };
        if (next.end <= next.start) {
          if (patch.start !== undefined) next.end = Math.min(next.start + slotMinutes, dayEndMinutes);
          else next.start = Math.max(next.end - slotMinutes, dayStartMinutes);
        }
        return next;
      }),
    );
  };

  const add = () => {
    setRanges((current) => {
      if (current.length === 0) return [{ start: dayStartMinutes, end: dayEndMinutes }];
      const start = Math.min(lastEnd + 60, dayEndMinutes - slotMinutes);
      return [...current, { start, end: Math.min(start + 60, dayEndMinutes) }];
    });
  };

  const isPreset = (range: DayTimeRange) =>
    ranges.length === 1 && ranges[0].start === range.start && ranges[0].end === range.end;

  return (
    <Modal
      title={daysTitle(days)}
      description={
        multiple
          ? `These times will replace what's already set on all ${days.length} days.`
          : "When are you free? Add as many times as you like."
      }
      onClose={onClose}
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          onApply(ranges);
        }}
      >
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Quick picks">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              aria-pressed={isPreset(preset.range)}
              onClick={() => setRanges([preset.range])}
              className={`flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 text-sm font-medium transition-[background-color,color,transform,outline-offset] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] ${
                buttonVariants[isPreset(preset.range) ? "primary" : "secondary"]
              }`}
            >
              {preset.label}
              <span
                className={`text-xs font-normal tabular-nums ${isPreset(preset.range) ? "text-primary-foreground/70" : "text-muted-foreground"}`}
              >
                {formatTimeRange(
                  dayjs().startOf("day").add(preset.range.start, "minute").valueOf(),
                  dayjs().startOf("day").add(preset.range.end, "minute").valueOf(),
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {ranges.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground animate-in fade-in duration-200">
              No times yet. Applying will clear {multiple ? "these days" : "this day"}.
            </p>
          ) : (
            ranges.map((range, index) => (
              <div
                key={index}
                className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <SelectInput
                    aria-label={`Time ${index + 1} start`}
                    value={range.start}
                    onChange={(event) => update(index, { start: Number(event.target.value) })}
                  >
                    {times.slice(0, -1).map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {clockLabel(minutes)}
                      </option>
                    ))}
                  </SelectInput>
                  <span className="text-sm text-muted-foreground" aria-hidden>
                    to
                  </span>
                  <SelectInput
                    aria-label={`Time ${index + 1} end`}
                    value={range.end}
                    onChange={(event) => update(index, { end: Number(event.target.value) })}
                  >
                    {times.slice(1).map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {clockLabel(minutes)}
                      </option>
                    ))}
                  </SelectInput>
                </div>
                <IconButton
                  label="Remove this time"
                  icon={<Trash2 className="size-4" aria-hidden />}
                  onClick={() => setRanges((current) => current.filter((_, i) => i !== index))}
                />
              </div>
            ))
          )}
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            disabled={!canAdd}
            onClick={add}
          >
            <Plus className="size-4" aria-hidden />
            {ranges.length === 0 ? "Add a time" : "Add another time"}
          </Button>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          {hasExisting && (
            <Button
              variant="secondary"
              className="text-destructive! sm:mr-auto"
              onClick={() => onApply([])}
            >
              {multiple ? "Clear these days" : "Clear day"}
            </Button>
          )}
          <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Apply
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
