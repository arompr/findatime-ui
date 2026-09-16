import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal, flushSync } from "react-dom";
import dayjs from "dayjs";
import type { IlamyPlugin } from "@ilamy/calendar";
import { moveSelection, removeSelection, resizeSelection } from "@/lib/availability";

type AvailabilityResizePluginOptions = {
  publicId: string;
  slotDurationMinutes?: number;
  /** Earliest time a block may start, in minutes from midnight. */
  dayStartMinutes?: number;
  /** Latest time a block may end, in minutes from midnight. */
  dayEndMinutes?: number;
};

type RequiredOptions = Required<AvailabilityResizePluginOptions>;

type Mode = "resize-start" | "resize-end" | "move";

type PressState = {
  pointerId: number;
  selectionId: string;
  startMs: number;
  endMs: number;
  mode: Mode;
  blockRect: DOMRect;
  originClientY: number;
  element: HTMLElement;
  active: boolean;
};

type PreviewRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  variant: "resize" | "move";
};

type Computed = {
  remove: boolean;
  startMs: number;
  endMs: number;
  preview: PreviewRect | null;
};

const EDGE_PX = 8;
const MIN_BLOCK_PX = 2;

function snapDeltaMin(deltaPx: number, pxPerMinute: number, slotMinutes: number): number {
  if (pxPerMinute <= 0) return 0;
  return Math.round(deltaPx / pxPerMinute / slotMinutes) * slotMinutes;
}

function boundsToRect(
  press: PressState,
  startMs: number,
  endMs: number,
  pxPerMinute: number,
  variant: PreviewRect["variant"],
): PreviewRect {
  const top = press.blockRect.top + ((startMs - press.startMs) / 60000) * pxPerMinute;
  const bottom = press.blockRect.top + ((endMs - press.startMs) / 60000) * pxPerMinute;
  return {
    top,
    left: press.blockRect.left,
    width: press.blockRect.width,
    height: Math.max(bottom - top, MIN_BLOCK_PX),
    variant,
  };
}

function compute(
  press: PressState,
  deltaPx: number,
  options: RequiredOptions,
): Computed {
  const { slotDurationMinutes, dayStartMinutes, dayEndMinutes } = options;
  const durationMin = (press.endMs - press.startMs) / 60000;
  const pxPerMinute = durationMin > 0 ? press.blockRect.height / durationMin : 0;
  const deltaMs = snapDeltaMin(deltaPx, pxPerMinute, slotDurationMinutes) * 60000;

  const dayStartMs = dayjs(press.startMs)
    .startOf("day")
    .add(dayStartMinutes, "minute")
    .valueOf();
  const dayEndMs = dayjs(press.startMs)
    .startOf("day")
    .add(dayEndMinutes, "minute")
    .valueOf();

  if (press.mode === "move") {
    let startMs = press.startMs + deltaMs;
    let endMs = press.endMs + deltaMs;
    if (startMs < dayStartMs) {
      const shift = dayStartMs - startMs;
      startMs += shift;
      endMs += shift;
    } else if (endMs > dayEndMs) {
      const shift = endMs - dayEndMs;
      startMs -= shift;
      endMs -= shift;
    }
    return {
      remove: false,
      startMs,
      endMs,
      preview: boundsToRect(press, startMs, endMs, pxPerMinute, "move"),
    };
  }

  if (press.mode === "resize-start") {
    const rawStartMs = press.startMs + deltaMs;
    const startMs = Math.min(Math.max(rawStartMs, dayStartMs), press.endMs);
    return {
      remove: rawStartMs >= press.endMs,
      startMs,
      endMs: press.endMs,
      preview: boundsToRect(press, startMs, press.endMs, pxPerMinute, "resize"),
    };
  }

  const rawEndMs = press.endMs + deltaMs;
  const endMs = Math.max(Math.min(rawEndMs, dayEndMs), press.startMs);
  return {
    remove: rawEndMs <= press.startMs,
    startMs: press.startMs,
    endMs,
    preview: boundsToRect(press, press.startMs, endMs, pxPerMinute, "resize"),
  };
}

function AvailabilityResizeProvider({
  children,
  options,
}: {
  children: ReactNode;
  options: RequiredOptions;
}) {
  const [preview, setPreview] = useState<PreviewRect | null>(null);
  const pressRef = useRef<PressState | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const threshold = 4;

    const resetBodyStyles = () => {
      document.body.style.removeProperty("user-select");
      document.body.style.removeProperty("-webkit-user-select");
    };

    const clear = () => {
      const press = pressRef.current;
      if (press) press.element.style.opacity = "";
      pressRef.current = null;
      setPreview(null);
      resetBodyStyles();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.closest("button")) return;
      const element = event.target.closest("[data-availability-id]");
      if (!(element instanceof HTMLElement)) return;

      const selectionId = element.dataset.availabilityId;
      const startIso = element.dataset.availabilityStart;
      const endIso = element.dataset.availabilityEnd;
      if (!selectionId || !startIso || !endIso) return;

      const start = dayjs(startIso);
      const end = dayjs(endIso);
      if (!start.isValid() || !end.isValid()) return;

      const rect = element.getBoundingClientRect();
      if (rect.height <= 0) return;

      const edge = Math.min(EDGE_PX, rect.height / 3);
      const fromTop = event.clientY - rect.top;
      const fromBottom = rect.bottom - event.clientY;
      let mode: Mode = "move";
      if (fromTop <= edge) {
        mode = "resize-start";
      } else if (fromBottom <= edge) {
        mode = "resize-end";
      }

      pressRef.current = {
        pointerId: event.pointerId,
        selectionId,
        startMs: start.valueOf(),
        endMs: end.valueOf(),
        mode,
        blockRect: rect,
        originClientY: event.clientY,
        element,
        active: false,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      const press = pressRef.current;
      if (!press || event.pointerId !== press.pointerId) return;

      const deltaPx = event.clientY - press.originClientY;
      if (!press.active) {
        if (Math.abs(deltaPx) < threshold) return;
        press.active = true;
        press.element.style.opacity = "0";
        document.body.style.setProperty("user-select", "none");
        document.body.style.setProperty("-webkit-user-select", "none");
      }
      setPreview(compute(press, deltaPx, optionsRef.current).preview);
    };

    const onPointerUp = (event: PointerEvent) => {
      const press = pressRef.current;
      if (!press || event.pointerId !== press.pointerId) return;

      const active = press.active;
      const deltaPx = event.clientY - press.originClientY;
      const result = compute(press, deltaPx, optionsRef.current);

      pressRef.current = null;
      resetBodyStyles();

      const { publicId } = optionsRef.current;
      const changed =
        result.startMs !== press.startMs || result.endMs !== press.endMs;

      // Commit the new range synchronously so the block is already in its final
      // spot when the source is un-hidden and the preview is dropped; otherwise
      // the cleanup paints for a frame at the stale position and flashes.
      if (active && (result.remove || changed)) {
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

      press.element.style.opacity = "";
      setPreview(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", clear);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", clear);
      document.body.style.removeProperty("user-select");
      document.body.style.removeProperty("-webkit-user-select");
    };
  }, []);

  return (
    <>
      {children}
      {preview &&
        createPortal(
          <div
            aria-hidden="true"
            className={
              preview.variant === "move"
                ? "pointer-events-none fixed z-50 rounded-sm border border-dashed border-green-700 bg-green-500/20"
                : "pointer-events-none fixed z-50 rounded-sm border border-blue-500 bg-blue-500/15"
            }
            style={{
              top: preview.top,
              left: preview.left,
              width: preview.width,
              height: preview.height,
            }}
          />,
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
