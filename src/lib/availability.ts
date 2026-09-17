import dayjs from "dayjs";

export type AvailabilitySelection = {
  id: string;
  startUtc: string;
  endUtc: string;
};

export type AvailabilitySelectionInput = {
  startUtc: string;
  endUtc: string;
  id?: string;
};

type Listener = () => void;

type MutableRange = {
  start: number;
  end: number;
  id?: string;
};

const selectionsByEvent = new Map<string, AvailabilitySelection[]>();
const listeners = new Set<Listener>();
const EMPTY: AvailabilitySelection[] = [];

function emit() {
  for (const listener of listeners) listener();
}

export function getSelections(publicId: string): AvailabilitySelection[] {
  return selectionsByEvent.get(publicId) ?? EMPTY;
}

export function subscribeAvailability(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function mergeSelections(
  existing: AvailabilitySelection[],
  added: AvailabilitySelectionInput[],
): AvailabilitySelection[] {
  const byDay = new Map<string, MutableRange[]>();

  const push = (startUtc: string, endUtc: string, id?: string) => {
    const start = dayjs(startUtc);
    const end = dayjs(endUtc);
    const key = start.startOf("day").toISOString();
    const list = byDay.get(key) ?? [];
    list.push({ start: start.valueOf(), end: end.valueOf(), id });
    byDay.set(key, list);
  };

  for (const selection of existing) {
    push(selection.startUtc, selection.endUtc, selection.id);
  }
  for (const selection of added) {
    push(selection.startUtc, selection.endUtc, selection.id);
  }

  const result: AvailabilitySelection[] = [];

  for (const ranges of byDay.values()) {
    ranges.sort((a, b) => a.start - b.start);
    let current: MutableRange = ranges[0];
    for (let i = 1; i < ranges.length; i++) {
      const range = ranges[i];
      if (range.start <= current.end) {
        current = { start: current.start, end: Math.max(current.end, range.end), id: current.id };
      } else {
        result.push(toSelection(current));
        current = range;
      }
    }
    result.push(toSelection(current));
  }

  return result;
}

function toSelection(range: MutableRange): AvailabilitySelection {
  return {
    id: range.id ?? crypto.randomUUID(),
    startUtc: dayjs(range.start).toISOString(),
    endUtc: dayjs(range.end).toISOString(),
  };
}

export function addSelections(
  publicId: string,
  added: AvailabilitySelectionInput[],
): void {
  selectionsByEvent.set(publicId, mergeSelections(getSelections(publicId), added));
  emit();
}

export function setSelections(
  publicId: string,
  ranges: AvailabilitySelectionInput[],
): void {
  selectionsByEvent.set(publicId, mergeSelections([], ranges));
  emit();
}

export function removeSelection(publicId: string, id: string): void {
  selectionsByEvent.set(
    publicId,
    getSelections(publicId).filter((selection) => selection.id !== id),
  );
  emit();
}

function setSelectionRange(
  publicId: string,
  id: string,
  newStartUtc: string,
  newEndUtc: string,
): void {
  const start = dayjs(newStartUtc);
  const end = dayjs(newEndUtc);
  const others = getSelections(publicId).filter((selection) => selection.id !== id);
  if (!start.isBefore(end)) {
    selectionsByEvent.set(publicId, others);
    emit();
    return;
  }
  selectionsByEvent.set(
    publicId,
    mergeSelections(others, [
      { id, startUtc: start.toISOString(), endUtc: end.toISOString() },
    ]),
  );
  emit();
}

export function resizeSelection(
  publicId: string,
  id: string,
  newStartUtc: string,
  newEndUtc: string,
): void {
  setSelectionRange(publicId, id, newStartUtc, newEndUtc);
}

export function moveSelection(
  publicId: string,
  id: string,
  newStartUtc: string,
  newEndUtc: string,
): void {
  setSelectionRange(publicId, id, newStartUtc, newEndUtc);
}
