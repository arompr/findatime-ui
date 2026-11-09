import { useSyncExternalStore } from "react";

function useMediaQuery(query: string, serverSnapshot: boolean): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onChange);
      return () => mediaQueryList.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverSnapshot,
  );
}

/**
 * True while the viewport is below Tailwind's `sm` breakpoint. Written as the
 * exact complement of `sm` (`width >= 40rem`): `max-width: 639px` leaves a gap
 * at fractional widths (e.g. 639.5px under 150% scaling) where neither the JS
 * nor the CSS layout applies.
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(width < 40rem)", false);
}

/** True on devices without hover (touchscreens), where hover affordances don't exist. */
export function useIsTouch(): boolean {
  return useMediaQuery("(hover: none)", false);
}
