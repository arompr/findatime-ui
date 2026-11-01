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
