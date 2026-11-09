import { browserTimezone } from "./time";

let cachedSupported: string[] | undefined;

function supportedTimezones(): string[] {
  if (cachedSupported === undefined) {
    cachedSupported = Intl.supportedValuesOf?.("timeZone") ?? [];
  }
  return cachedSupported;
}

/**
 * Selectable IANA timezone ids: the platform list plus UTC and the current
 * browser timezone. An event's stored value is always kept so an id the
 * runtime no longer reports still renders as selected.
 */
export function timezoneOptions(current?: string | null): string[] {
  const zones = new Set<string>(["UTC", browserTimezone(), ...supportedTimezones()]);
  if (current) zones.add(current);
  return [...zones].sort();
}

export type TimezoneInfo = {
  id: string;
  /** "New York" */
  place: string;
  /** "America", "America · Argentina"; empty for UTC. */
  region: string;
  /** "UTC-5" */
  offset: string;
  /** Minutes east of UTC right now, for ordering. */
  offsetMinutes: number;
  /** Lowercased text the search matches against. */
  haystack: string;
};

function zoneName(tz: string, timeZoneName: Intl.DateTimeFormatOptions["timeZoneName"], at: Date) {
  try {
    return (
      new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName })
        .formatToParts(at)
        .find((part) => part.type === "timeZoneName")?.value ?? ""
    );
  } catch {
    return "";
  }
}

function parseOffset(label: string): number {
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(label);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === "-" ? -minutes : minutes;
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Display and search data for an IANA id. */
export function timezoneInfo(id: string, at: Date = new Date()): TimezoneInfo {
  const isUtc = id === "UTC" || id === "Etc/UTC";
  const segments = id.split("/");
  const place = isUtc ? "UTC" : (segments.at(-1) ?? id).replace(/_/g, " ");
  const region = isUtc ? "" : segments.slice(0, -1).join(" · ").replace(/_/g, " ");
  const gmtOffset = isUtc ? "GMT" : zoneName(id, "shortOffset", at) || "GMT";
  const offsetMinutes = parseOffset(gmtOffset);
  const offset = gmtOffset.replace("GMT", "UTC");
  // Generic names carry the country or area people search for:
  // "France Time", "Central European Time", "Eastern Time", "ET".
  const names = [zoneName(id, "shortGeneric", at), zoneName(id, "longGeneric", at), zoneName(id, "long", at)];
  const haystack = normalize(
    [
      id.replace(/[/_]/g, " "),
      place,
      region,
      offset,
      gmtOffset,
      ...names,
      isUtc ? "coordinated universal time" : "",
    ].join(" | "),
  );
  return { id, place, region, offset, offsetMinutes, haystack };
}

/**
 * Zones matching every word of `query`, best first: place-name prefix, then
 * any word prefix, then anywhere.
 */
export function searchTimezones(zones: TimezoneInfo[], query: string): TimezoneInfo[] {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return zones;
  const scored: { zone: TimezoneInfo; score: number }[] = [];
  for (const zone of zones) {
    if (!words.every((word) => zone.haystack.includes(word))) continue;
    const place = normalize(zone.place);
    const first = words[0];
    const score = place.startsWith(first)
      ? 0
      : new RegExp(`(^|[\\s|·(])${first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(zone.haystack)
        ? 1
        : 2;
    scored.push({ zone, score });
  }
  return scored.sort((a, b) => a.score - b.score || a.zone.place.localeCompare(b.zone.place)).map((s) => s.zone);
}
