import { X } from "lucide-react";
import { formatTimeRange } from "@/lib/time";

type AvailabilityBlockProps = {
  id: string;
  startUtc: string;
  endUtc: string;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
};

/**
 * A committed availability block rendered inside the calendar grid. The
 * data-availability-* attributes are read by availabilityResizePlugin, which
 * drives move/resize from document-level pointer events.
 *
 * Mouse: affordances (grips, delete) reveal on hover. Touch: tapping selects
 * the block, which reveals resize knobs and delete and lets it be dragged
 * immediately (an unselected block needs a press-and-hold so swipes scroll).
 */
export function AvailabilityBlock({
  id,
  startUtc,
  endUtc,
  selected,
  onSelect,
  onDelete,
}: AvailabilityBlockProps) {
  const label = formatTimeRange(Date.parse(startUtc), Date.parse(endUtc));

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Available ${label}${selected ? ", selected" : ""}`}
      aria-pressed={selected}
      className={`findatime-block group relative h-full w-full select-none overflow-visible rounded-md border text-left outline-none transition-[background-color,border-color,box-shadow,transform] duration-150 [--spacing:0.25rem] [-webkit-touch-callout:none] animate-in fade-in zoom-in-95 focus-visible:ring-2 focus-visible:ring-ring ${
        selected
          ? "z-10 touch-none cursor-grab border-brand bg-brand/25 shadow-[var(--shadow-soft)] ring-2 ring-brand/30"
          : "cursor-grab border-foreground/55 bg-foreground/10 hover:border-foreground/80 hover:bg-foreground/15"
      }`}
      data-availability-id={id}
      data-availability-start={startUtc}
      data-availability-end={endUtc}
      data-availability-selected={selected ? "true" : undefined}
      onContextMenu={(event) => event.preventDefault()}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        } else if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault();
          onDelete();
        }
      }}
    >
      <span className="findatime-block-label pointer-events-none block truncate px-1.5 pt-2 text-[11px] font-medium leading-tight text-foreground/80 tabular-nums">
        {label}
      </span>

      {/* Mouse: grab bars on hover. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[3px] flex justify-center opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:hidden"
      >
        <span className="h-[3px] w-6 rounded-full bg-foreground/50" />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[3px] flex justify-center opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:hidden"
      >
        <span className="h-[3px] w-6 rounded-full bg-foreground/50" />
      </span>
      <span aria-hidden className="absolute inset-x-0 top-0 h-2 max-h-[33%] cursor-ns-resize" />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-2 max-h-[33%] cursor-ns-resize" />

      {/* Selected: resize knobs straddling the edges. */}
      {selected && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-card shadow-sm animate-in zoom-in-50 duration-150 [@media(hover:none)]:size-3.5"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-1/2 size-3 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-brand bg-card shadow-sm animate-in zoom-in-50 duration-150 [@media(hover:none)]:size-3.5"
          />
        </>
      )}

      <button
        type="button"
        aria-label={`Remove ${label}`}
        title="Remove"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          onDelete();
        }}
        className={`findatime-block-delete absolute right-0.5 top-0.5 inline-flex cursor-pointer items-center justify-center rounded-md bg-foreground text-background shadow-sm transition-[opacity,transform] duration-150 hover:bg-destructive active:scale-90 ${
          selected
            ? "pointer-events-auto size-6 opacity-100 animate-in zoom-in-75 [@media(hover:none)]:size-7"
            : "pointer-events-none size-5 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 [@media(hover:none)]:hidden"
        }`}
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
