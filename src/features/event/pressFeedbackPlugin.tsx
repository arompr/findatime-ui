import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { IlamyPlugin } from "@ilamy/calendar";

/** drag-to-create's (non-configurable) touch press-and-hold delay. */
const HOLD_MS = 400;
/** Wait before showing the ring so quick taps and scrolls don't flash it. */
const SHOW_DELAY_MS = 110;
const SLOP_PX = 10;
const RING_SIZE_PX = 64;

type Ring = {
  x: number;
  y: number;
  phase: "charging" | "done";
};

/**
 * Touch feedback for drag-to-create: while a finger rests on an empty slot a
 * ring grows under it, and when the hold completes (the moment the range
 * selection starts) it pops and the device ticks. Purely visual; the gesture
 * itself is handled by drag-to-create.
 */
export function pressFeedbackPlugin(): IlamyPlugin {
  return {
    name: "press-feedback",
    provider: PressFeedbackProvider,
  };
}

function PressFeedbackProvider({ children }: { children: ReactNode }) {
  const [ring, setRing] = useState<Ring | null>(null);

  useEffect(() => {
    let showTimer: number | null = null;
    let holdTimer: number | null = null;
    let hideTimer: number | null = null;
    let origin: { x: number; y: number; pointerId: number } | null = null;

    const clearTimers = () => {
      for (const timer of [showTimer, holdTimer, hideTimer]) {
        if (timer !== null) window.clearTimeout(timer);
      }
      showTimer = holdTimer = hideTimer = null;
    };

    const cancel = () => {
      clearTimers();
      origin = null;
      setRing(null);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch" || !event.isPrimary) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(".findatime-calendar")) return;
      if (target.closest("[data-availability-id], button")) return;
      const cell = target.closest<HTMLElement>("[data-start]");
      if (!cell || cell.dataset.disabled === "true") return;

      cancel();
      const point = { x: event.clientX, y: event.clientY };
      origin = { ...point, pointerId: event.pointerId };
      showTimer = window.setTimeout(() => {
        setRing({ ...point, phase: "charging" });
      }, SHOW_DELAY_MS);
      holdTimer = window.setTimeout(() => {
        navigator.vibrate?.(10);
        setRing({ ...point, phase: "done" });
        hideTimer = window.setTimeout(() => setRing(null), 260);
        origin = null;
      }, HOLD_MS);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!origin || event.pointerId !== origin.pointerId) return;
      if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) >= SLOP_PX) cancel();
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (!origin || event.pointerId !== origin.pointerId) return;
      cancel();
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    return () => {
      clearTimers();
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
    };
  }, []);

  return (
    <>
      {children}
      {ring &&
        createPortal(
          <span
            aria-hidden
            className="pointer-events-none fixed z-50 rounded-full border-2 border-brand bg-brand/20"
            style={{
              top: ring.y - RING_SIZE_PX / 2,
              left: ring.x - RING_SIZE_PX / 2,
              width: RING_SIZE_PX,
              height: RING_SIZE_PX,
              ...(ring.phase === "charging"
                ? {
                    animation: `findatime-press-ring ${HOLD_MS - SHOW_DELAY_MS}ms cubic-bezier(0.3, 0.7, 0.4, 1) forwards`,
                  }
                : { animation: "findatime-press-pop 240ms ease-out forwards" }),
            }}
          />,
          document.body,
        )}
    </>
  );
}
