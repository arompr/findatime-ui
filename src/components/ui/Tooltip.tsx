import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { placeFloating, type Side } from "./floating";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: Side;
  /** Extra classes for the inline wrapper around the trigger. */
  className?: string;
  /**
   * Touch behavior: "hold" (press and hold, for triggers whose tap already does
   * something) or "tap" (tap toggles, for purely informational triggers).
   */
  touchTrigger?: "tap" | "hold";
};

const HOVER_DELAY_MS = 350;
const TOUCH_HOLD_MS = 450;
const TOUCH_LINGER_MS = 1400;
const TAP_AUTO_HIDE_MS = 3000;
// Finger travel beyond this is a scroll/swipe, not a tap.
const TAP_SLOP_PX = 10;

/**
 * Hover (mouse) or keyboard-focus tooltip. On touch, pressing and holding the
 * trigger shows it briefly, the way native icon buttons do; with
 * `touchTrigger="tap"` a tap toggles it instead.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  className = "",
  touchTrigger = "hold",
}: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const tapStartRef = useRef<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; side: Side } | null>(
    null,
  );

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const showAfter = (delay: number) => {
    clearTimer();
    timerRef.current = window.setTimeout(() => setOpen(true), delay);
  };

  const hide = () => {
    clearTimer();
    setOpen(false);
  };

  useEffect(() => clearTimer, []);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const trigger = triggerRef.current;
    const tip = tipRef.current;
    if (!trigger || !tip) return;
    setPosition(
      placeFloating(trigger.getBoundingClientRect(), tip.getBoundingClientRect(), { side }),
    );
  }, [open, side, content]);

  useEffect(() => {
    if (!open) return;
    const close = () => hide();
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [open]);

  useEffect(() => {
    if (!open || touchTrigger !== "tap") return;
    const closeOutside = (event: PointerEvent) => {
      if (!triggerRef.current?.contains(event.target as Node)) hide();
    };
    document.addEventListener("pointerdown", closeOutside, true);
    return () => document.removeEventListener("pointerdown", closeOutside, true);
  }, [open, touchTrigger]);

  return (
    <>
      <span
        ref={triggerRef}
        className={`inline-flex ${className}`}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") showAfter(HOVER_DELAY_MS);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") hide();
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") {
            hide();
          } else if (touchTrigger === "tap") {
            tapStartRef.current = { x: event.clientX, y: event.clientY };
          } else {
            showAfter(TOUCH_HOLD_MS);
          }
        }}
        onPointerUp={(event) => {
          if (event.pointerType === "mouse") return;
          if (touchTrigger === "tap") {
            const start = tapStartRef.current;
            tapStartRef.current = null;
            if (
              !start ||
              Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP_PX
            ) {
              return;
            }
            if (open) {
              hide();
            } else {
              setOpen(true);
              clearTimer();
              timerRef.current = window.setTimeout(() => setOpen(false), TAP_AUTO_HIDE_MS);
            }
            return;
          }
          if (open) {
            clearTimer();
            timerRef.current = window.setTimeout(() => setOpen(false), TOUCH_LINGER_MS);
          } else {
            clearTimer();
          }
        }}
        onPointerCancel={() => {
          tapStartRef.current = null;
          hide();
        }}
        onContextMenu={(event) => {
          if (open || timerRef.current !== null) event.preventDefault();
        }}
        onFocus={(event) => {
          if (event.target instanceof HTMLElement && event.target.matches(":focus-visible")) {
            setOpen(true);
          }
        }}
        onBlur={hide}
        onKeyDown={(event) => {
          if (event.key === "Escape") hide();
        }}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            className={`pointer-events-none fixed z-[200] max-w-64 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium leading-snug text-background shadow-[var(--shadow-lift)] ${
              position
                ? `animate-in fade-in zoom-in-95 duration-150 ${
                    position.side === "top" ? "slide-in-from-bottom-1" : "slide-in-from-top-1"
                  }`
                : "invisible"
            }`}
            style={position ? { top: position.top, left: position.left } : { top: 0, left: 0 }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
