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

function intlZoneName(tz: string, timeZoneName: Intl.DateTimeFormatOptions["timeZoneName"], at: Date) {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName")?.value;
  } catch {
    // Unknown id, or an older engine without the generic/offset styles.
    return undefined;
  }
}

/**
 * Short label for `tz`: a real abbreviation when English has one ("ET", "PT",
 * "MST"), otherwise the UTC offset ("UTC+1"). Initials of the long name are
 * avoided because they collide ("CT" is Central and Chile) or mislead ("CEST").
 */
export function timezoneShortName(tz: string, at: Date = new Date()): string {
  if (tz === "UTC" || tz === "Etc/UTC") return "UTC";
  const generic = intlZoneName(tz, "shortGeneric", at);
  if (generic && /^[A-Z]{2,5}$/.test(generic)) return generic;
  // Intl writes offsets as "GMT+1"; people know them as "UTC+1".
  const offset = intlZoneName(tz, "shortOffset", at) ?? intlZoneName(tz, "short", at);
  return offset ? offset.replace(/^GMT/, "UTC") : tz.replace(/_/g, " ");
}

/**
 * Zone name people recognize, e.g. "Eastern Time" for America/Toronto, rather
 * than the IANA city (which reads as "Toronto" to someone in Montréal).
 */
export function timezoneDisplayName(tz: string, at: Date = new Date()): string {
  if (tz === "UTC" || tz === "Etc/UTC") return "UTC";
  const name = intlZoneName(tz, "longGeneric", at);
  if (name && !name.startsWith("GMT")) return name;
  return `${(tz.split("/").pop() ?? tz).replace(/_/g, " ")} time`;
}

/** "Eastern Time (ET)", "Central European Time (UTC+1)", "UTC". */
export function timezoneFullName(tz: string, at: Date = new Date()): string {
  const name = timezoneDisplayName(tz, at);
  const short = timezoneShortName(tz, at);
  return name === short ? name : `${name} (${short})`;
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
