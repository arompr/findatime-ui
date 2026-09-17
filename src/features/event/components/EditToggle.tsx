import { Button } from "@/features/home/components/ui/Button";
import { ErrorText } from "@/features/home/components/ui/ErrorText";

export type AvailabilityMode = "read" | "edit";

type EditToggleProps = {
  mode: AvailabilityMode;
  saving: boolean;
  error?: string;
  onEdit: () => void;
  onSave: () => void;
};

export function EditToggle({
  mode,
  saving,
  error,
  onEdit,
  onSave,
}: EditToggleProps) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-slate-500">
          {mode === "edit"
            ? "Click or drag to mark when you're free. Drag a block to move it, drag its edges to resize it, or hover to delete it."
            : "Read-only. Click Edit to update your availability."}
        </p>
        {mode === "edit" ? (
          <Button loading={saving} onClick={onSave} className="shrink-0">
            Save
          </Button>
        ) : (
          <Button onClick={onEdit} className="shrink-0">
            Edit
          </Button>
        )}
      </div>
      <ErrorText message={error} />
    </div>
  );
}
