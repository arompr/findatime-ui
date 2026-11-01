export const INTERVAL_OPTIONS = [15, 30, 60] as const;

export type IntervalMinutes = (typeof INTERVAL_OPTIONS)[number];

export const DEFAULT_INTERVAL_MINUTES: IntervalMinutes = 30;

/** Coerce the API's numeric/string interval into the closed set the backend accepts. */
export function toIntervalMinutes(value: number | string | null | undefined): IntervalMinutes {
  const minutes = Number(value);
  return INTERVAL_OPTIONS.includes(minutes as IntervalMinutes)
    ? (minutes as IntervalMinutes)
    : DEFAULT_INTERVAL_MINUTES;
}

/** Short label for an interval: "15 min", "30 min", "1 hour". */
export function intervalLabel(minutes: number): string {
  return minutes >= 60 ? `${minutes / 60} hour` : `${minutes} min`;
}
