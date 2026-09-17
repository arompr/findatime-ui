import type { AvailabilitySelectionInput } from "@/lib/availability";

function storageKey(publicId: string, guestId: string): string {
  return `findatime.availability.${publicId}.${guestId}`;
}

function isStoredRange(value: unknown): value is AvailabilitySelectionInput {
  if (typeof value !== "object" || value === null) return false;
  const range = value as { startUtc?: unknown; endUtc?: unknown };
  return typeof range.startUtc === "string" && typeof range.endUtc === "string";
}

export function loadAvailability(
  publicId: string,
  guestId: string,
): AvailabilitySelectionInput[] {
  const raw = window.localStorage.getItem(storageKey(publicId, guestId));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredRange).map(({ startUtc, endUtc }) => ({
      startUtc,
      endUtc,
    }));
  } catch {
    return [];
  }
}

export function hasSavedAvailability(publicId: string, guestId: string): boolean {
  return window.localStorage.getItem(storageKey(publicId, guestId)) !== null;
}

export function saveAvailability(
  publicId: string,
  guestId: string,
  ranges: AvailabilitySelectionInput[],
): void {
  const payload = ranges.map(({ startUtc, endUtc }) => ({ startUtc, endUtc }));
  window.localStorage.setItem(storageKey(publicId, guestId), JSON.stringify(payload));
}
