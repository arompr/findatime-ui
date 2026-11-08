import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal, flushSync } from "react-dom";
import dayjs from "dayjs";
import type { IlamyPlugin } from "@ilamy/calendar";
import { moveSelection, removeSelection, resizeSelection } from "@/lib/availability";
import { formatTimeRange } from "@/lib/time";

type AvailabilityResizePluginOptions = {
  publicId: string;
  slotDurationMinutes?: number;
  /** Earliest time a block may start, in minutes from midnight. */
  dayStartMinutes?: number;
  /** Latest time a block may end, in minutes from midnight. */
  dayEndMinutes?: number;
  /** Called when a block is picked up (drag activates). */
  onActivate?: (selectionId: string) => void;
};

type RequiredOptions = Required<Omit<AvailabilityResizePluginOptions, "onActivate">> &
  Pick<AvailabilityResizePluginOptions, "onActivate">;

type Mode = "resize-start" | "resize-end" | "move";

type PressState = {
  pointerId: number;
  isTouch: boolean;
  /** Touch on an unselected block: needs a press-and-hold before dragging. */
  needsHold: boolean;
  selectionId: string;
  startMs: number;
  endMs: number;
  mode: Mode;
  blockRect: DOMRect;
  originClientX: number;
  originClientY: number;
  element: HTMLElement;
  active: boolean;
  lastSnapKey: string;
};

type Preview = {
  top: number;
  left: number;
  width: number;
  height: number;
  mode: Mode;
  remove: boolean;
  label: string;
};

type Computed = {
  remove: boolean;
  startMs: number;
  endMs: number;
  preview: Preview;
};

const EDGE_PX = 8;
const EDGE_PX_TOUCH = 22;
const DRAG_THRESHOLD_PX = 4;
const TOUCH_SLOP_PX = 10;
/** Matches drag-to-create's touch hold so both gestures feel the same. */
const TOUCH_LONG_PRESS_MS = 400;
const PRESSING_FEEDBACK_DELAY_MS = 110;
const MIN_BLOCK_PX = 2;
const CLICK_SUPPRESS_MS = 350;

let lastGestureEndAt = 0;

/**
 * True right after a block drag ends, so the click the browser synthesizes on
 * release isn't treated as a tap on the block.
 */
export function blockGestureJustEnded(): boolean {
  return performance.now() - lastGestureEndAt < CLICK_SUPPRESS_MS;
}

function snapDeltaMin(deltaPx: number, pxPerMinute: number, slotMinutes: number): number {
  if (pxPerMinute <= 0) return 0;
  return Math.round(deltaPx / pxPerMinute / slotMinutes) * slotMinutes;
}

function compute(press: PressState, deltaPx: number, options: RequiredOptions): Computed {
  const { slotDurationMinutes, dayStartMinutes, dayEndMinutes } = options;
  const durationMin = (press.endMs - press.startMs) / 60000;
  const pxPerMinute = durationMin > 0 ? press.blockRect.height / durationMin : 0;
  const deltaMs = snapDeltaMin(deltaPx, pxPerMinute, slotDurationMinutes) * 60000;

  const dayStart = dayjs(press.startMs).startOf("day");
  const dayStartMs = dayStart.add(dayStartMinutes, "minute").valueOf();
  const dayEndMs = dayStart.add(dayEndMinutes, "minute").valueOf();

  let startMs = press.startMs;
  let endMs = press.endMs;
  let remove = false;

  if (press.mode === "move") {
    startMs += deltaMs;
    endMs += deltaMs;
    if (startMs < dayStartMs) {
      endMs += dayStartMs - startMs;
      startMs = dayStartMs;
    } else if (endMs > dayEndMs) {
      startMs -= endMs - dayEndMs;
      endMs = dayEndMs;
    }
  } else if (press.mode === "resize-start") {
    const rawStartMs = press.startMs + deltaMs;
    startMs = Math.min(Math.max(rawStartMs, dayStartMs), press.endMs);
    remove = rawStartMs >= press.endMs;
  } else {
    const rawEndMs = press.endMs + deltaMs;
    endMs = Math.max(Math.min(rawEndMs, dayEndMs), press.startMs);
    remove = rawEndMs <= press.startMs;
  }

  const top = press.blockRect.top + ((startMs - press.startMs) / 60000) * pxPerMinute;
  const bottom = press.blockRect.top + ((endMs - press.startMs) / 60000) * pxPerMinute;
  return {
    remove,
    startMs,
    endMs,
    preview: {
      top,
      left: press.blockRect.left,
      width: press.blockRect.width,
      height: Math.max(bottom - top, MIN_BLOCK_PX),
      mode: press.mode,
      remove,
      label: remove ? "Release to remove" : formatTimeRange(startMs, endMs),
    },
  };
}

function AvailabilityResizeProvider({
  children,
  options,
}: {
  children: ReactNode;
  options: RequiredOptions;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const pressRef = useRef<PressState | null>(null);
  const timersRef = useRef<number[]>([]);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const clearTimers = () => {
      for (const timer of timersRef.current) window.clearTimeout(timer);
      timersRef.current = [];
    };

    const setBodySelectable = (selectable: boolean) => {
      for (const property of ["user-select", "-webkit-user-select"]) {
        if (selectable) {
          document.body.style.removeProperty(property);
        } else {
          document.body.style.setProperty(property, "none");
        }
      }
    };

    const releaseElement = (press: PressState) => {
      press.element.style.opacity = "";
      delete press.element.dataset.pressing;
    };

    const clear = () => {
      clearTimers();
      const press = pressRef.current;
      if (press) releaseElement(press);
      pressRef.current = null;
      setPreview(null);
      setBodySelectable(true);
    };

    const update = (press: PressState, deltaPx: number) => {
      const result = compute(press, deltaPx, optionsRef.current);
      const snapKey = `${result.startMs}:${result.endMs}:${result.remove}`;
      if (press.isTouch && snapKey !== press.lastSnapKey) {
        navigator.vibrate?.(result.remove ? 14 : 3);
      }
      press.lastSnapKey = snapKey;
      setPreview(result.preview);
    };

    const activate = (press: PressState) => {
      press.active = true;
      delete press.element.dataset.pressing;
      press.element.style.opacity = "0.3";
      setBodySelectable(false);
      window.getSelection()?.removeAllRanges();
      if (press.isTouch) navigator.vibrate?.(10);
      optionsRef.current.onActivate?.(press.selectionId);
    };

    // While a drag is active, suppress the browser's own touch scrolling.
    const blockTouchScroll = (event: TouchEvent) => {
      if (pressRef.current?.active) event.preventDefault();
    };

    // A long press must never surface the browser's context menu: on Android
    // it would also fire pointercancel and abort the drag.
    const blockContextMenu = (event: Event) => {
      if (pressRef.current) event.preventDefault();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.closest("button")) return;
      const element = event.target.closest("[data-availability-id]");
      if (!(element instanceof HTMLElement)) return;

      const { availabilityId, availabilityStart, availabilityEnd, availabilitySelected } =
        element.dataset;
      if (!availabilityId || !availabilityStart || !availabilityEnd) return;

      const start = dayjs(availabilityStart);
      const end = dayjs(availabilityEnd);
      if (!start.isValid() || !end.isValid()) return;

      const rect = element.getBoundingClientRect();
      if (rect.height <= 0) return;

      const isTouch = event.pointerType === "touch";
      const edge = Math.min(isTouch ? EDGE_PX_TOUCH : EDGE_PX, rect.height / 3);
      const fromTop = event.clientY - rect.top;
      const fromBottom = rect.bottom - event.clientY;
      let mode: Mode = "move";
      if (fromTop <= edge) {
        mode = "resize-start";
      } else if (fromBottom <= edge) {
        mode = "resize-end";
      }

      clear();
      const press: PressState = {
        pointerId: event.pointerId,
        isTouch,
        needsHold: isTouch && availabilitySelected !== "true",
        selectionId: availabilityId,
        startMs: start.valueOf(),
        endMs: end.valueOf(),
        mode,
        blockRect: rect,
        originClientX: event.clientX,
        originClientY: event.clientY,
        element,
        active: false,
        lastSnapKey: "",
      };
      pressRef.current = press;

      if (press.needsHold) {
        // Press-and-hold then drag, matching drag-to-create's touch model: a
        // quick swipe stays a scroll, a hold picks the block up.
        timersRef.current.push(
          window.setTimeout(() => {
            if (pressRef.current === press) press.element.dataset.pressing = "true";
          }, PRESSING_FEEDBACK_DELAY_MS),
          window.setTimeout(() => {
            if (pressRef.current !== press) return;
            activate(press);
            update(press, 0);
          }, TOUCH_LONG_PRESS_MS),
        );
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const press = pressRef.current;
      if (!press || event.pointerId !== press.pointerId) return;

      const deltaPx = event.clientY - press.originClientY;

      if (press.needsHold && !press.active) {
        const moved = Math.hypot(event.clientX - press.originClientX, deltaPx);
        if (moved >= TOUCH_SLOP_PX) clear();
        return;
      }

      if (!press.active) {
        if (Math.abs(deltaPx) < DRAG_THRESHOLD_PX) return;
        activate(press);
      }
      update(press, deltaPx);
    };

    const onPointerUp = (event: PointerEvent) => {
      const press = pressRef.current;
      if (!press || event.pointerId !== press.pointerId) return;

      clearTimers();
      pressRef.current = null;
      setBodySelectable(true);

      if (!press.active) {
        releaseElement(press);
        return;
      }

      lastGestureEndAt = performance.now();
      const result = compute(press, event.clientY - press.originClientY, optionsRef.current);
      const { publicId } = optionsRef.current;
      const changed = result.startMs !== press.startMs || result.endMs !== press.endMs;

      // Commit synchronously so the block is already in its final spot when
      // the source is un-hidden and the preview is dropped; otherwise the
      // cleanup paints for a frame at the stale position and flashes.
      if (result.remove || changed) {
        flushSync(() => {
          if (result.remove) {
            removeSelection(publicId, press.selectionId);
          } else {
            const newStartUtc = dayjs(result.startMs).toISOString();
            const newEndUtc = dayjs(result.endMs).toISOString();
            if (press.mode === "move") {
              moveSelection(publicId, press.selectionId, newStartUtc, newEndUtc);
            } else {
              resizeSelection(publicId, press.selectionId, newStartUtc, newEndUtc);
            }
          }
        });
      }

      releaseElement(press);
      setPreview(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && pressRef.current) clear();
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", clear);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("contextmenu", blockContextMenu, { capture: true });
    window.addEventListener("touchmove", blockTouchScroll, { passive: false });
    return () => {
      clear();
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", clear);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("contextmenu", blockContextMenu, { capture: true });
      window.removeEventListener("touchmove", blockTouchScroll);
    };
  }, []);

  const labelAbove = preview !== null && preview.top > 40;

  return (
    <>
      {children}
      {preview &&
        createPortal(
          <div
            aria-hidden="true"
            className={`pointer-events-none fixed z-50 rounded-md border-2 shadow-[var(--shadow-lift)] transition-[top,height,background-color,border-color] duration-75 ease-out ${
              preview.remove
                ? "border-destructive border-dashed bg-destructive/15"
                : "border-brand bg-brand/30"
            }`}
            style={{
              top: preview.top,
              left: preview.left,
              width: preview.width,
              height: preview.height,
            }}
          >
            <span
              className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium tabular-nums shadow-md ${
                preview.remove ? "bg-destructive text-destructive-foreground" : "bg-foreground text-background"
              } ${labelAbove ? "-top-8" : "-bottom-8"}`}
            >
              {preview.label}
            </span>
          </div>,
          document.body,
        )}
    </>
  );
}

export function availabilityResizePlugin(
  options: AvailabilityResizePluginOptions,
): IlamyPlugin {
  return {
    name: "availability-resize",
    provider: ({ children }) => (
      <AvailabilityResizeProvider
        options={{
          slotDurationMinutes: 15,
          dayStartMinutes: 0,
          dayEndMinutes: 24 * 60,
          ...options,
        }}
      >
        {children}
      </AvailabilityResizeProvider>
    ),
  };
}
