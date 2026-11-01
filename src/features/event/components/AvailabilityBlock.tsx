import { Trash2 } from "lucide-react";

type AvailabilityBlockProps = {
  id: string;
  startUtc: string;
  endUtc: string;
  onDelete: () => void;
};

/**
 * A committed availability block rendered inside the calendar grid. The
 * data-availability-* attributes are read by availabilityResizePlugin, which
 * drives move/resize from document-level pointer events.
 *
 * Affordances (grab bars, resize edges, delete) reveal on hover for pointer
 * devices and stay visible on touch devices, where hover doesn't exist.
 */
export function AvailabilityBlock({ id, startUtc, endUtc, onDelete }: AvailabilityBlockProps) {
  return (
    <div
      className="group relative h-full w-full [--spacing:0.25rem] cursor-grab select-none rounded-sm border border-green-600 bg-green-500/20 transition-colors hover:border-green-700 [-webkit-touch-callout:none]"
      data-availability-id={id}
      data-availability-start={startUtc}
      data-availability-end={endUtc}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[2px] flex justify-center opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <span className="h-[3px] w-6 rounded-full bg-green-700" />
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[2px] flex justify-center opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <span className="h-[3px] w-6 rounded-full bg-green-700" />
      </span>
      <span
        aria-hidden="true"
        className="group/top absolute inset-x-0 top-0 h-2 max-h-[33%] cursor-ns-resize"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] rounded-b-sm bg-green-700 opacity-0 transition-opacity group-hover/top:opacity-100 [@media(hover:none)]:opacity-100" />
      </span>
      <span
        aria-hidden="true"
        className="group/bottom absolute inset-x-0 bottom-0 h-2 max-h-[33%] cursor-ns-resize"
      >
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] rounded-t-sm bg-green-700 opacity-0 transition-opacity group-hover/bottom:opacity-100 [@media(hover:none)]:opacity-100" />
      </span>
      <button
        type="button"
        aria-label="Delete availability"
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          onDelete();
        }}
        className="pointer-events-none absolute right-[2px] top-[2px] cursor-pointer rounded-sm bg-green-600/90 p-[3px] text-white opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 hover:bg-green-700 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:p-1.5 [@media(hover:none)]:opacity-100"
      >
        <Trash2 className="h-[12px] w-[12px]" />
      </button>
    </div>
  );
}
