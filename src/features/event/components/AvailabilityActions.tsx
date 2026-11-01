import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorText } from "@/components/ui/ErrorText";

export type AvailabilityMode = "read" | "edit";

type AvailabilityActionsProps = {
  mode: AvailabilityMode;
  isTouch: boolean;
  saving: boolean;
  saved: boolean;
  error?: string;
  onEdit: () => void;
  onSave: () => void;
};

function editHint(isTouch: boolean): string {
  return isTouch
    ? "Tap slots to add them, or hold and drag across the grid to select a range. Hold a block to move it, hold its edges to resize, tap ✕ to remove it. Swipe sideways to change day."
    : "Click or drag to mark when you're free. Drag a block to move it, drag its edges to resize it, or hover to delete it.";
}

export function AvailabilityActions({
  mode,
  isTouch,
  saving,
  saved,
  error,
  onEdit,
  onSave,
}: AvailabilityActionsProps) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-slate-500">
          {mode === "edit"
            ? editHint(isTouch)
            : `Read-only. ${isTouch ? "Tap" : "Click"} Edit to update your availability.`}
          {mode === "read" && saved && (
            <span className="mt-1 flex items-center gap-1 text-sm font-medium text-green-700">
              <Check className="size-4" aria-hidden />
              Availability saved
            </span>
          )}
        </p>
        {mode === "edit" ? (
          <Button loading={saving} onClick={onSave} className="w-full shrink-0 sm:w-auto">
            Save
          </Button>
        ) : (
          <Button onClick={onEdit} className="w-full shrink-0 sm:w-auto">
            Edit
          </Button>
        )}
      </div>
      <ErrorText message={error} />
    </div>
  );
}
