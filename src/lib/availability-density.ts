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

type NamedRangeHolder = RangeHolder & { name: string };

/** Names of the participants whose availability covers `timeMs`. */
export function namesFreeAt(participants: NamedRangeHolder[], timeMs: number): string[] {
  return participants
    .filter((participant) =>
      participant.ranges.some(
        (range) =>
          dayjs(range.startUtc).valueOf() <= timeMs && timeMs < dayjs(range.endUtc).valueOf(),
      ),
    )
    .map((participant) => participant.name);
}

/**
 * Upcoming segments where the most people overlap (at least two), earliest
 * first. Segments are split at day boundaries so each one reads as a single
 * day's time range.
 */
export function bestSegments(
  segments: DensitySegment[],
  nowMs: number,
  limit = 3,
): DensitySegment[] {
  const upcoming = segments.filter((segment) => segment.startMs >= nowMs);
  const max = upcoming.reduce((best, segment) => Math.max(best, segment.count), 0);
  if (max < 2) return [];

  const result: DensitySegment[] = [];
  for (const segment of upcoming) {
    if (segment.count !== max) continue;
    let startMs = segment.startMs;
    while (startMs < segment.endMs && result.length < limit) {
      const dayEnd = dayjs(startMs).startOf("day").add(1, "day").valueOf();
      const endMs = Math.min(segment.endMs, dayEnd);
      result.push({ startMs, endMs, count: max });
      startMs = endMs;
    }
    if (result.length >= limit) break;
  }
  return result;
}

/** Splits segments at local midnight so each piece belongs to one day. */
function splitByDay(segments: DensitySegment[]): DensitySegment[] {
  const result: DensitySegment[] = [];
  for (const segment of segments) {
    let startMs = segment.startMs;
    while (startMs < segment.endMs) {
      const dayEnd = dayjs(startMs).startOf("day").add(1, "day").valueOf();
      const endMs = Math.min(segment.endMs, dayEnd);
      result.push({ startMs, endMs, count: segment.count });
      startMs = endMs;
    }
  }
  return result;
}

/**
 * Per local day (YYYY-MM-DD): the highest overlap count reached that day and
 * the earliest window reaching it.
 */
export function dayPeaks(segments: DensitySegment[]): Map<string, DensitySegment> {
  const peaks = new Map<string, DensitySegment>();
  for (const piece of splitByDay(segments)) {
    const key = dayjs(piece.startMs).format("YYYY-MM-DD");
    const current = peaks.get(key);
    if (!current || piece.count > current.count) peaks.set(key, piece);
  }
  return peaks;
}

/** A day's overlap windows, most people first, then earliest first. */
export function dayWindows(
  segments: DensitySegment[],
  dayStartMs: number,
  limit = 3,
): DensitySegment[] {
  const dayEndMs = dayjs(dayStartMs).add(1, "day").valueOf();
  return segments
    .filter((segment) => segment.endMs > dayStartMs && segment.startMs < dayEndMs)
    .map((segment) => ({
      startMs: Math.max(segment.startMs, dayStartMs),
      endMs: Math.min(segment.endMs, dayEndMs),
      count: segment.count,
    }))
    .sort((a, b) => b.count - a.count || a.startMs - b.startMs)
    .slice(0, limit);
}
