import dayjs from "dayjs";
import type { AvailabilityRange } from "./availability";

export type DensitySegment = {
  startMs: number;
  endMs: number;
  count: number;
};

type RangeHolder = {
  ranges: AvailabilityRange[];
};

/**
 * Sweeps the union of all participants' ranges and produces contiguous
 * segments annotated with how many participants are available throughout
 * each segment.
 */
export function buildDensitySegments(participants: RangeHolder[]): DensitySegment[] {
  const ranges = participants.flatMap((participant) =>
    participant.ranges.map((range) => ({
      start: dayjs(range.startUtc).valueOf(),
      end: dayjs(range.endUtc).valueOf(),
    })),
  );
  if (ranges.length === 0) return [];

  const boundaries = [...new Set(ranges.flatMap((r) => [r.start, r.end]))].sort(
    (a, b) => a - b,
  );

  const segments: DensitySegment[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const startMs = boundaries[i];
    const endMs = boundaries[i + 1];
    if (endMs <= startMs) continue;

    let count = 0;
    for (const range of ranges) {
      if (range.start <= startMs && range.end >= endMs) count++;
    }
    if (count === 0) continue;

    const prev = segments[segments.length - 1];
    if (prev && prev.count === count && prev.endMs === startMs) {
      prev.endMs = endMs;
    } else {
      segments.push({ startMs, endMs, count });
    }
  }

  return segments;
}

/** Number of participants available at `timeMs`, or 0. */
export function densityAt(segments: DensitySegment[], timeMs: number): number {
  let low = 0;
  let high = segments.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const segment = segments[mid];
    if (timeMs < segment.startMs) {
      high = mid - 1;
    } else if (timeMs >= segment.endMs) {
      low = mid + 1;
    } else {
      return segment.count;
    }
  }
  return 0;
}
