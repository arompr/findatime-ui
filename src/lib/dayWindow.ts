import dayjs from "dayjs";
import "./time";

export const DEFAULT_DAY_START_HOUR = 9;
export const DEFAULT_DAY_END_HOUR = 21;

export const DAY_START_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour);
export const DAY_END_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour + 1);

/** The calendar's visible hours in the browser's frame, as minutes from local midnight. */
export type LocalDayWindow = {
  startMinutes: number;
  endMinutes: number;
};

/** Coerce the API's numeric/string hour, falling back when it's missing or out of range. */
export function toDayHour(
  value: number | string | null | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  const hour = Number(value);
  return Number.isInteger(hour) && hour >= min && hour <= max ? hour : fallback;
}

/** "9 AM", "12 PM", "Midnight" for 0/24. */
export function hourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return "Midnight";
  if (hour === 12) return "Noon";
  return `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? "AM" : "PM"}`;
}

/**
 * The event's window is wall-clock hours in its anchor frame (the event
 * timezone, or UTC for legacy events without one). Shift it into the browser's
 * frame for `reference`'s date and widen it to whole slots. A shifted window
 * that crosses local midnight can't be shown as one span, so it becomes the
 * whole day.
 */
export function localDayWindow(
  startHour: number,
  endHour: number,
  timezone: string | null,
  slotMinutes: number,
  reference: Date = new Date(),
): LocalDayWindow {
  const frame = timezone ?? "UTC";
  const anchorDay = dayjs(reference).tz(frame).format("YYYY-MM-DD");
  const anchorMidnight = dayjs.tz(anchorDay, frame);
  const start = anchorMidnight.add(startHour, "hour");
  const end = anchorMidnight.add(endHour, "hour");
  const localMidnight = start.local().startOf("day");

  const startMinutes = start.diff(localMidnight, "minute");
  const endMinutes = end.diff(localMidnight, "minute");
  if (startMinutes < 0 || endMinutes > 24 * 60) {
    return { startMinutes: 0, endMinutes: 24 * 60 };
  }
  return {
    startMinutes: Math.floor(startMinutes / slotMinutes) * slotMinutes,
    endMinutes: Math.min(24 * 60, Math.ceil(endMinutes / slotMinutes) * slotMinutes),
  };
}
