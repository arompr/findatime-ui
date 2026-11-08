import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "findatime-theme";
const listeners = new Set<() => void>();

function readTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode): the choice just won't persist.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The initial theme is applied by an inline script in index.html (stored
 * choice, else the OS preference) so it's correct on first paint.
 */
export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as const);
  const toggle = useCallback(() => applyTheme(readTheme() === "dark" ? "light" : "dark"), []);
  return [theme, toggle];
}
