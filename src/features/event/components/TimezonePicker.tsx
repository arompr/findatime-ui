import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { inputClassName, inputStateClassName } from "@/components/ui/TextInput";
import { browserTimezone } from "@/lib/time";
import { searchTimezones, timezoneInfo, timezoneOptions, type TimezoneInfo } from "@/lib/timezones";

type TimezonePickerProps = {
  value: string;
  onChange: (timezone: string) => void;
  // Wired by <Field>.
  id?: string;
  "aria-describedby"?: string;
  invalid?: boolean;
};

type Row = { zone: TimezoneInfo; tag?: string };

/**
 * A searchable timezone combobox. Matches city, region, country-ish names
 * ("France", "Eastern"), abbreviations ("ET") and offsets ("GMT+1", "utc-5").
 */
export function TimezonePicker({ value, onChange, id, invalid = false, ...rest }: TimezonePickerProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const viewer = browserTimezone();
  // Built when first opened; ~400 zones of Intl lookups is cheap but not free.
  const zones = useMemo(() => (open ? timezoneOptions(value).map((tz) => timezoneInfo(tz)) : []), [open]);
  const selected = useMemo(() => timezoneInfo(value), [value]);

  const rows = useMemo<Row[]>(() => {
    if (query.trim()) return searchTimezones(zones, query).map((zone) => ({ zone }));
    const byId = new Map(zones.map((zone) => [zone.id, zone]));
    const suggested: Row[] = [];
    const seen = new Set<string>();
    const suggest = (tz: string, tag: string) => {
      const zone = byId.get(tz);
      if (!zone || seen.has(tz)) return;
      seen.add(tz);
      suggested.push({ zone, tag });
    };
    suggest(value, "Selected");
    suggest(viewer, "Your timezone");
    suggest("UTC", "Universal");
    return [...suggested, ...zones.filter((zone) => !seen.has(zone.id)).map((zone) => ({ zone }))];
  }, [zones, query, value, viewer]);
  const suggestedCount = query.trim() ? 0 : rows.filter((row) => row.tag).length;

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, rows]);

  const openPicker = () => {
    setQuery("");
    setActive(0);
    setOpen(true);
  };

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) trigger?.focus();
  };

  const choose = (tz: string) => {
    onChange(tz);
    close(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, rows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const row = rows[active];
      if (row) choose(row.zone.id);
    } else if (event.key === "Escape") {
      // Close only the picker, not the surrounding modal.
      event.stopPropagation();
      close(true);
    } else if (event.key === "Tab") {
      close(false);
    }
  };

  return (
    <>
      <button
        ref={setTrigger}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={rest["aria-describedby"]}
        onClick={() => (open ? close(false) : openPicker())}
        className={`${inputClassName} ${inputStateClassName(invalid)} flex cursor-pointer items-center gap-2 pr-3 text-left`}
      >
        <span className="min-w-0 flex-1 truncate">
          {selected.place}
          {selected.region && <span className="text-muted-foreground"> · {selected.region}</span>}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{selected.offset}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      <Popover open={open} anchor={trigger} onClose={() => close(false)} align="start" role="presentation">
        <div style={{ width: trigger?.offsetWidth }} className="flex max-w-[calc(100vw-1rem)] flex-col">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              data-autofocus
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={rows[active] ? `${listId}-${active}` : undefined}
              aria-label="Search timezones"
              placeholder="Search a city or country"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className="h-11 min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none sm:h-10 sm:text-sm"
            />
          </div>
          <div ref={listRef} id={listId} role="listbox" className="max-h-72 overflow-y-auto overscroll-contain p-1">
            {rows.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No timezone matches “{query}”</p>
            )}
            {rows.map((row, index) => (
              <div key={row.zone.id}>
                {index === suggestedCount && suggestedCount > 0 && (
                  <div className="mx-2 my-1 border-t border-border" role="separator" />
                )}
                <div
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={row.zone.id === value}
                  onPointerMove={() => setActive(index)}
                  onClick={() => choose(row.zone.id)}
                  className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${
                    index === active ? "bg-secondary" : ""
                  }`}
                >
                  <Check
                    className={`size-4 shrink-0 text-brand ${row.zone.id === value ? "" : "invisible"}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium text-foreground">{row.zone.place}</span>
                    {row.zone.region && <span className="text-muted-foreground"> · {row.zone.region}</span>}
                  </span>
                  {row.tag && (
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {row.tag}
                    </span>
                  )}
                  <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {row.zone.offset}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Popover>
    </>
  );
}
