import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { placeFloating, type Align, type Side } from "./floating";

type PopoverProps = {
  open: boolean;
  /** Element (or viewport rect) the popover is attached to. */
  anchor: HTMLElement | DOMRect | null;
  onClose: () => void;
  children: ReactNode;
  side?: Side;
  align?: Align;
  className?: string;
  role?: string;
  /** Pointer presses inside these elements don't count as "outside". */
  ignoreOutside?: (target: Element) => boolean;
};

function rectOf(anchor: HTMLElement | DOMRect): DOMRect {
  return anchor instanceof HTMLElement ? anchor.getBoundingClientRect() : anchor;
}

/**
 * A floating panel portalled to body. Closes on Escape and on a press
 * outside. On scroll/resize it follows an element anchor; a rect anchor is a
 * snapshot, so the popover closes instead.
 */
export function Popover({
  open,
  anchor,
  onClose,
  children,
  side = "bottom",
  align = "end",
  className = "",
  role = "dialog",
  ignoreOutside,
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const ignoreRef = useRef(ignoreOutside);
  ignoreRef.current = ignoreOutside;
  const [layoutTick, setLayoutTick] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number; side: Side } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!open || !anchor || !panelRef.current) {
      setPosition(null);
      return;
    }
    setPosition(
      placeFloating(rectOf(anchor), panelRef.current.getBoundingClientRect(), { side, align }),
    );
  }, [open, anchor, side, align, children, layoutTick]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (panelRef.current?.contains(target)) return;
      if (anchor instanceof HTMLElement && anchor.contains(target)) return;
      if (ignoreRef.current?.(target)) return;
      onCloseRef.current();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    const onViewportChange = (event: Event) => {
      if (event.target instanceof Node && panelRef.current?.contains(event.target)) return;
      if (anchor instanceof HTMLElement) {
        setLayoutTick((tick) => tick + 1);
      } else {
        onCloseRef.current();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [open, anchor]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role={role}
      className={`fixed z-[150] rounded-xl border border-border bg-popover text-popover-foreground shadow-[var(--shadow-lift)] ${
        position
          ? `animate-in fade-in zoom-in-95 duration-150 ${
              position.side === "top" ? "slide-in-from-bottom-1" : "slide-in-from-top-1"
            }`
          : "invisible"
      } ${className}`}
      style={position ? { top: position.top, left: position.left } : { top: 0, left: 0 }}
    >
      {children}
    </div>,
    document.body,
  );
}
