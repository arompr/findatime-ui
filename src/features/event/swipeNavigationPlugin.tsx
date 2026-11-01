import { useEffect, useRef } from "react";
import { useIlamyCalendarContext, type IlamyPlugin } from "@ilamy/calendar";

const MAX_SWIPE_DURATION_MS = 450;
const MIN_SWIPE_DISTANCE_PX = 60;
const AXIS_RATIO = 1.5;

/**
 * Flips the calendar one period (one day in day view) on a quick horizontal
 * swipe. Only quick flicks navigate: press-and-hold drags belong to the
 * drag-to-create / resize plugins (they activate after ~400 ms, beyond this
 * plugin's duration guard), and vertical gestures stay page scrolls.
 *
 * Mount on mobile only.
 */
export function swipeNavigationPlugin(): IlamyPlugin {
  return {
    name: "swipe-navigation",
    provider: SwipeNavigationProvider,
  };
}

function SwipeNavigationProvider({ children }: { children: React.ReactNode }) {
  const { prevPeriod, nextPeriod } = useIlamyCalendarContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef({ prevPeriod, nextPeriod });
  navigationRef.current = { prevPeriod, nextPeriod };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let tracking = false;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        tracking = false;
        return;
      }
      tracking = true;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      startTime = Date.now();
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!tracking) return;
      tracking = false;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const duration = Date.now() - startTime;

      if (
        duration >= MAX_SWIPE_DURATION_MS ||
        Math.abs(dx) < MIN_SWIPE_DISTANCE_PX ||
        Math.abs(dx) < Math.abs(dy) * AXIS_RATIO
      ) {
        return;
      }

      if (dx < 0) {
        navigationRef.current.nextPeriod();
      } else {
        navigationRef.current.prevPeriod();
      }
    };

    const onTouchCancel = () => {
      tracking = false;
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchCancel);
    };
  }, []);

  return (
    <div ref={containerRef} className="contents">
      {children}
    </div>
  );
}
