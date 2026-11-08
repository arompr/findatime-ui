export type Side = "top" | "bottom";
export type Align = "start" | "center" | "end";

const VIEWPORT_MARGIN = 8;

/**
 * Places a floating box of `size` next to `anchor` (viewport coordinates),
 * flipping to the other side when it would leave the viewport and clamping
 * horizontally so it never overflows on narrow screens.
 */
export function placeFloating(
  anchor: DOMRect,
  size: { width: number; height: number },
  { side = "bottom", align = "center", offset = 8 }: { side?: Side; align?: Align; offset?: number },
): { top: number; left: number; side: Side } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const above = anchor.top - offset - size.height;
  const below = anchor.bottom + offset;
  let resolvedSide = side;
  if (side === "top" && above < VIEWPORT_MARGIN && below + size.height <= viewportHeight) {
    resolvedSide = "bottom";
  } else if (
    side === "bottom" &&
    below + size.height > viewportHeight - VIEWPORT_MARGIN &&
    above >= VIEWPORT_MARGIN
  ) {
    resolvedSide = "top";
  }

  let left =
    align === "start"
      ? anchor.left
      : align === "end"
        ? anchor.right - size.width
        : anchor.left + anchor.width / 2 - size.width / 2;
  left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(left, viewportWidth - size.width - VIEWPORT_MARGIN),
  );

  return { top: resolvedSide === "top" ? above : below, left, side: resolvedSide };
}
