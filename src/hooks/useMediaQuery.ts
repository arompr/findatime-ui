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

/** True while the viewport is below Tailwind's `sm` breakpoint (<640px). */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 639px)", false);
}

/** True on devices without hover (touchscreens), where hover affordances don't exist. */
export function useIsTouch(): boolean {
  return useMediaQuery("(hover: none)", false);
}
