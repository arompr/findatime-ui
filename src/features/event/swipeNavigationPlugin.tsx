import { useEffect, useRef, type ReactNode } from "react";
import { useIlamyCalendarContext, type IlamyPlugin } from "@ilamy/calendar";

/** Must match the press-and-hold delay of drag-to-create / block drags. */
const HOLD_MS = 400;
const AXIS_LOCK_PX = 10;
const AXIS_RATIO = 1.2;
const COMMIT_RATIO = 0.22;
const COMMIT_VELOCITY = 0.45;
const RESISTANCE = 0.85;
const ENTER_OFFSET_PX = 36;

const BODY_SELECTOR = '[data-testid="calendar-body"]';

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Mobile day view: the day follows the finger on a horizontal swipe and flips
 * to the previous/next day when released past a distance or velocity
 * threshold, otherwise springs back.
 *
 * A finger that holds still for HOLD_MS belongs to the drag-to-create / block
 * drag plugins instead, so the axis is only claimed for movement that starts
 * before then. Selected blocks (touch-action: none) never start a swipe.
 *
 * Mount on mobile only. Pair with periodTransitionPlugin for the enter
 * animation.
 */
export function swipeNavigationPlugin(): IlamyPlugin {
  return {
    name: "swipe-navigation",
    provider: SwipeNavigationProvider,
  };
}

function SwipeNavigationProvider({ children }: { children: ReactNode }) {
  const { prevPeriod, nextPeriod } = useIlamyCalendarContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef({ prevPeriod, nextPeriod });
  navigationRef.current = { prevPeriod, nextPeriod };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    type Gesture = {
      startX: number;
      startY: number;
      startTime: number;
      lastX: number;
      lastTime: number;
      velocity: number;
      state: "pending" | "swiping" | "ignored";
      body: HTMLElement | null;
    };
    let gesture: Gesture | null = null;

    const setOffset = (body: HTMLElement | null, dx: number, animate: boolean) => {
      if (!body) return;
      body.style.transition = animate && !prefersReducedMotion()
        ? "transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 260ms ease-out"
        : "none";
      body.style.transform = dx === 0 ? "" : `translate3d(${dx}px, 0, 0)`;
      body.style.opacity = dx === 0 ? "" : String(Math.max(0.5, 1 - Math.abs(dx) / 600));
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        gesture = null;
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      const onSelectedBlock = target?.closest('[data-availability-selected="true"]');
      const touch = event.touches[0];
      gesture = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: performance.now(),
        lastX: touch.clientX,
        lastTime: performance.now(),
        velocity: 0,
        state: onSelectedBlock ? "ignored" : "pending",
        body: container.querySelector<HTMLElement>(BODY_SELECTOR),
      };
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!gesture || gesture.state === "ignored") return;
      const touch = event.touches[0];
      const dx = touch.clientX - gesture.startX;
      const dy = touch.clientY - gesture.startY;
      const now = performance.now();

      if (gesture.state === "pending") {
        if (Math.hypot(dx, dy) < AXIS_LOCK_PX) return;
        const early = now - gesture.startTime < HOLD_MS;
        gesture.state = early && Math.abs(dx) > Math.abs(dy) * AXIS_RATIO ? "swiping" : "ignored";
        if (gesture.state === "ignored") return;
      }

      const elapsed = now - gesture.lastTime;
      if (elapsed > 0) {
        gesture.velocity = (touch.clientX - gesture.lastX) / elapsed;
      }
      gesture.lastX = touch.clientX;
      gesture.lastTime = now;
      setOffset(gesture.body, dx * RESISTANCE, false);
    };

    const finish = (event: TouchEvent | null) => {
      const current = gesture;
      gesture = null;
      if (!current || current.state !== "swiping") return;

      const touch = event?.changedTouches[0];
      const dx = touch ? touch.clientX - current.startX : 0;
      const width = container.getBoundingClientRect().width || window.innerWidth;
      const commit =
        event !== null &&
        (Math.abs(dx) > width * COMMIT_RATIO ||
          (Math.abs(current.velocity) > COMMIT_VELOCITY && Math.sign(current.velocity) === Math.sign(dx)));

      if (!commit) {
        setOffset(current.body, 0, true);
        return;
      }

      navigator.vibrate?.(6);
      setOffset(current.body, 0, false);
      if (dx < 0) {
        navigationRef.current.nextPeriod();
      } else {
        navigationRef.current.prevPeriod();
      }
    };

    const onTouchEnd = (event: TouchEvent) => finish(event);
    const onTouchCancel = () => finish(null);

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
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

/**
 * Slides the calendar body in from the direction of travel whenever the
 * visible period changes (swipe, arrows, week strip, "Today").
 */
export function periodTransitionPlugin(): IlamyPlugin {
  return {
    name: "period-transition",
    provider: PeriodTransitionProvider,
  };
}

function PeriodTransitionProvider({ children }: { children: ReactNode }) {
  const { currentRange, view } = useIlamyCalendarContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const previousRef = useRef<{ time: number; view: string } | null>(null);

  const time = currentRange.start.valueOf();

  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = { time, view };
    if (!previous || previous.view !== view || previous.time === time) return;
    if (prefersReducedMotion()) return;

    const body = containerRef.current?.querySelector<HTMLElement>(BODY_SELECTOR);
    if (!body) return;
    const direction = time > previous.time ? 1 : -1;
    body.animate(
      [
        { transform: `translate3d(${direction * ENTER_OFFSET_PX}px, 0, 0)`, opacity: 0.35 },
        { transform: "translate3d(0, 0, 0)", opacity: 1 },
      ],
      { duration: 240, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
  }, [time, view]);

  return (
    <div ref={containerRef} className="contents">
      {children}
    </div>
  );
}
