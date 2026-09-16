import dayjs from "dayjs";
import type { OtherAvailability } from "@/features/event/otherAvailability";

export type DensitySegment = {
  startUtc: string;
  endUtc: string;
  count: number;
};

export function buildDensitySegments(
  others: OtherAvailability[],
): DensitySegment[] {
  const events = others.flatMap((user) =>
    user.ranges.map((r) => ({
      start: dayjs(r.startUtc).valueOf(),
      end: dayjs(r.endUtc).valueOf(),
    })),
  );
  if (events.length === 0) return [];

  const points = new Set<number>();
  for (const event of events) {
    points.add(event.start);
    points.add(event.end);
  }
  const boundaries = [...points].sort((a, b) => a - b);

  const segments: DensitySegment[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const segStart = boundaries[i];
    const segEnd = boundaries[i + 1];
    if (segEnd <= segStart) continue;

    let count = 0;
    for (const event of events) {
      if (event.start <= segStart && event.end >= segEnd) count++;
    }
    if (count === 0) continue;

    const prev = segments[segments.length - 1];
    if (prev && prev.count === count && prev.endUtc === dayjs(segStart).toISOString()) {
      prev.endUtc = dayjs(segEnd).toISOString();
    } else {
      segments.push({
        startUtc: dayjs(segStart).toISOString(),
        endUtc: dayjs(segEnd).toISOString(),
        count,
      });
    }
  }

  return segments;
}
