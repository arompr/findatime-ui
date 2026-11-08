import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, Hand, MousePointerClick, Move, Pencil, Pointer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorText } from "@/components/ui/ErrorText";

export type AvailabilityMode = "read" | "edit";

type ToolbarProps = {
  mode: AvailabilityMode;
  dirty: boolean;
  saving: boolean;
  justSaved: boolean;
  canCancel: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
};

function Status({ mode, dirty, justSaved }: Pick<ToolbarProps, "mode" | "dirty" | "justSaved">) {
  if (justSaved) {
    return (
      <span
        key="saved"
        className="inline-flex items-center gap-1 text-xs font-medium text-success animate-in fade-in zoom-in-95 duration-200"
      >
        <Check className="size-3.5" aria-hidden />
        Saved
      </span>
    );
  }
  if (mode === "edit" && dirty) {
    return (
      <span
        key="dirty"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-strong animate-in fade-in duration-200 dark:text-brand"
      >
        <span className="size-1.5 rounded-full bg-current" aria-hidden />
        Unsaved changes
      </span>
    );
  }
  if (mode === "edit") {
    return (
      <span key="editing" className="text-xs font-medium text-muted-foreground">
        Editing
      </span>
    );
  }
  return null;
}

function SaveButtons({
  dirty,
  saving,
  canCancel,
  onCancel,
  onSave,
  className = "",
}: Pick<ToolbarProps, "dirty" | "saving" | "canCancel" | "onCancel" | "onSave"> & {
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {canCancel && (
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving} className="flex-1 sm:flex-none">
          {dirty ? "Discard" : "Cancel"}
        </Button>
      )}
      <Button
        size="sm"
        onClick={onSave}
        loading={saving}
        disabled={!dirty && !canCancel}
        className="flex-[2] sm:flex-none sm:px-5"
      >
        {!saving && <Check className="size-4" aria-hidden />}
        {dirty || !canCancel ? "Save" : "Done"}
      </Button>
    </div>
  );
}

/** Card header: title, live status, and Edit / Save controls. */
export function AvailabilityToolbar(props: ToolbarProps) {
  const { mode, onEdit } = props;
  return (
    <div className="flex min-h-10 items-center justify-between gap-3">
      <div className="flex min-w-0 items-baseline gap-2.5">
        <h2 className="text-base font-semibold tracking-tight">
          {mode === "edit" ? "Mark when you're free" : "Everyone's availability"}
        </h2>
        <Status mode={props.mode} dirty={props.dirty} justSaved={props.justSaved} />
      </div>
      {mode === "read" ? (
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5" aria-hidden />
          Edit mine
        </Button>
      ) : (
        <SaveButtons {...props} className="hidden sm:flex" />
      )}
    </div>
  );
}

/**
 * Mobile edit mode: Save/Cancel pinned to the bottom of the viewport so they
 * stay reachable while scrolling the calendar.
 */
export function MobileSaveBar(props: ToolbarProps & { error?: string }) {
  if (props.mode !== "edit") return null;
  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md animate-in slide-in-from-bottom-full duration-300 ease-out sm:hidden">
      {props.error && (
        <div className="mb-2">
          <ErrorText message={props.error} />
        </div>
      )}
      <SaveButtons {...props} className="w-full" />
    </div>,
    document.body,
  );
}

type HintProps = {
  isTouch: boolean;
  hasSelection: boolean;
  month?: boolean;
};

function HintItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className="text-muted-foreground/80" aria-hidden>
        {icon}
      </span>
      {children}
    </li>
  );
}

export function EditHint({ isTouch, hasSelection, month = false }: HintProps) {
  if (month) {
    return (
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <HintItem icon={<MousePointerClick className="size-3.5" />}>
          {isTouch ? "Tap" : "Click"} a day to set your times
        </HintItem>
        <HintItem icon={<Move className="size-3.5" />}>Drag across days to fill several</HintItem>
      </ul>
    );
  }
  if (isTouch && hasSelection) {
    return (
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground animate-in fade-in duration-200">
        <HintItem icon={<Move className="size-3.5" />}>Drag to move</HintItem>
        <HintItem icon={<span className="inline-block size-2.5 rounded-full border-2 border-brand" />}>
          Drag a knob to resize
        </HintItem>
        <HintItem icon={<Pointer className="size-3.5" />}>Tap outside to finish</HintItem>
      </ul>
    );
  }
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {isTouch ? (
        <>
          <HintItem icon={<Pointer className="size-3.5" />}>Tap a slot to add it</HintItem>
          <HintItem icon={<Hand className="size-3.5" />}>Hold, then drag for a range</HintItem>
          <HintItem icon={<MousePointerClick className="size-3.5" />}>Tap a block to edit</HintItem>
        </>
      ) : (
        <>
          <HintItem icon={<MousePointerClick className="size-3.5" />}>Click or drag to add</HintItem>
          <HintItem icon={<Move className="size-3.5" />}>Drag a block to move it</HintItem>
          <HintItem icon={<span className="inline-block h-0.5 w-3 rounded-full bg-current" />}>
            Drag its edges to resize
          </HintItem>
        </>
      )}
    </ul>
  );
}
