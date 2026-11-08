import { useEffect, useRef, useState, type ReactNode } from "react";
import { Popover } from "./Popover";
import type { Align } from "./floating";

export type MenuItem = {
  label: string;
  icon?: ReactNode;
  description?: string;
  destructive?: boolean;
  onSelect: () => void;
};

type MenuProps = {
  /** Renders the trigger; spread `triggerProps` onto a button. */
  trigger: (triggerProps: {
    ref: (element: HTMLButtonElement | null) => void;
    onClick: () => void;
    "aria-haspopup": "menu";
    "aria-expanded": boolean;
  }) => ReactNode;
  items: MenuItem[];
  align?: Align;
};

export function Menu({ trigger, items, align = "end" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) anchor?.focus();
  };

  return (
    <>
      {trigger({
        ref: setAnchor,
        onClick: () => setOpen((value) => !value),
        "aria-haspopup": "menu",
        "aria-expanded": open,
      })}
      <Popover
        open={open}
        anchor={anchor}
        onClose={() => close(false)}
        align={align}
        role="presentation"
        className="min-w-52 p-1"
      >
        <div
          ref={listRef}
          role="menu"
          onKeyDown={(event) => {
            const buttons = [
              ...(listRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? []),
            ];
            const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
            if (event.key === "ArrowDown") {
              event.preventDefault();
              buttons[(index + 1) % buttons.length]?.focus();
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
            } else if (event.key === "Escape" || event.key === "Tab") {
              close(event.key === "Escape");
            }
          }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                close(false);
                item.onSelect();
              }}
              className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:bg-secondary active:scale-[0.99] sm:min-h-10 ${
                item.destructive
                  ? "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              {item.icon && (
                <span
                  className={`shrink-0 ${item.destructive ? "" : "text-muted-foreground"}`}
                  aria-hidden
                >
                  {item.icon}
                </span>
              )}
              <span className="flex min-w-0 flex-col">
                <span className="font-medium">{item.label}</span>
                {item.description && (
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      </Popover>
    </>
  );
}
