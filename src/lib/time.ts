import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * The API exchanges availability as UTC instants and snaps them to the event's
 * grid in the event timezone. The browser converts only for display; these
 * helpers format instants in the browser's timezone.
 */

export function browserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Short display name for `tz`, e.g. "ET" for America/New_York. */
export function timezoneShortName(tz: string, at: Date = new Date()): string {
  for (const timeZoneName of ["shortGeneric", "short"] as const) {
    try {
      const part = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName })
        .formatToParts(at)
        .find((p) => p.type === "timeZoneName");
      if (part) return part.value;
    } catch {
      // Older engines reject "shortGeneric"; fall through to "short".
    }
  }
  return tz.replace(/_/g, " ");
}

/** Readable place name for an IANA id, e.g. "New York" for America/New_York. */
export function timezonePlaceName(tz: string): string {
  if (tz === "UTC" || tz === "Etc/UTC") return "UTC";
  return (tz.split("/").pop() ?? tz).replace(/_/g, " ");
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
