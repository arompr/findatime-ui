import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { useTheme } from "@/hooks/useTheme";
import { MyEventsMenu } from "@/features/home/MyEventsMenu";

function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 text-brand" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="4" fill="currentColor" opacity="0.18" />
      <rect x="3" y="5" width="18" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="m8.5 13.5 2.4 2.4 4.6-4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RootComponent() {
  const [theme, toggleTheme] = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-6">
        <Link
          to="/"
          className="-ml-1 inline-flex min-h-10 items-center gap-2 rounded-lg px-1 font-display text-lg font-semibold tracking-tight transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandMark />
          Findatime
        </Link>
        <div className="flex items-center gap-1">
          <MyEventsMenu />
          <IconButton
            label={`Switch to ${nextTheme} theme`}
            tooltipSide="bottom"
            onClick={toggleTheme}
            icon={
              theme === "dark" ? (
                <Sun className="size-[18px]" aria-hidden />
              ) : (
                <Moon className="size-[18px]" aria-hidden />
              )
            }
          />
        </div>
      </header>
      <Outlet />
    </div>
  );
}

export const Route = createRootRoute({ component: RootComponent });
