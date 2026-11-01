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
