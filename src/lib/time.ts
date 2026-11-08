import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * The API exchanges availability as wall-clock datetimes without an offset
 * ("2026-10-31T09:00:00") paired with an IANA timezone, while the calendar
 * works with absolute instants. These helpers convert at that boundary.
 */

export function browserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Wall-clock datetime in `tz` -> UTC ISO instant. */
export function wallClockToInstant(wallClock: string, tz: string): string {
  return dayjs.tz(wallClock, tz).toISOString();
}

/** UTC ISO instant -> wall-clock datetime in `tz`, formatted the way the API expects. */
export function instantToWallClock(instant: string, tz: string): string {
  return dayjs(instant).tz(tz).format("YYYY-MM-DDTHH:mm:ss");
}

function clock(ms: number): string {
  const time = dayjs(ms);
  return time.minute() === 0 ? time.format("h") : time.format("h:mm");
}

/** "9 – 10:30 AM", "11:30 AM – 1 PM" in the browser's timezone. */
export function formatTimeRange(startMs: number, endMs: number): string {
  const start = dayjs(startMs);
  if (start.isSame(start.startOf("day")) && dayjs(endMs).isSame(start.add(1, "day"))) {
    return "All day";
  }
  const startMeridiem = dayjs(startMs).format("A");
  const endMeridiem = dayjs(endMs).format("A");
  return startMeridiem === endMeridiem
    ? `${clock(startMs)} – ${clock(endMs)} ${endMeridiem}`
    : `${clock(startMs)} ${startMeridiem} – ${clock(endMs)} ${endMeridiem}`;
}

/** "Today", "Tomorrow", or "Tue, Nov 10". */
export function formatDayLabel(ms: number): string {
  const day = dayjs(ms).startOf("day");
  const today = dayjs().startOf("day");
  if (day.isSame(today)) return "Today";
  if (day.isSame(today.add(1, "day"))) return "Tomorrow";
  return day.year() === today.year() ? day.format("ddd, MMM D") : day.format("ddd, MMM D, YYYY");
}
