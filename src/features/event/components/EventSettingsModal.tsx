import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorText } from "@/components/ui/ErrorText";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { SelectInput } from "@/components/ui/SelectInput";
import {
  INTERVAL_OPTIONS,
  intervalLabel,
  type IntervalMinutes,
} from "@/lib/intervals";
import { timezoneOptions } from "@/lib/timezones";

type EventSettingsModalProps = {
  timezone: string | null;
  intervalMinutes: IntervalMinutes;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onSave: (input: { timezone: string | null; intervalMinutes: IntervalMinutes }) => void;
};

export function EventSettingsModal({
  timezone,
  intervalMinutes,
  loading,
  error,
  onClose,
  onSave,
}: EventSettingsModalProps) {
  const [selectedTimezone, setSelectedTimezone] = useState(timezone ?? "");
  const [selectedInterval, setSelectedInterval] = useState<IntervalMinutes>(
    intervalMinutes,
  );
  const zones = useMemo(() => timezoneOptions(timezone), [timezone]);
  const changed =
    selectedInterval !== intervalMinutes || selectedTimezone !== (timezone ?? "");

  return (
    <Modal title="Event settings" onClose={onClose}>
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            timezone: selectedTimezone === "" ? null : selectedTimezone,
            intervalMinutes: selectedInterval,
          });
        }}
      >
        <div role="radiogroup" aria-labelledby="event-interval-label" className="flex flex-col gap-1.5">
          <span id="event-interval-label" className="text-sm font-medium">
            Time slot length
          </span>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
            {INTERVAL_OPTIONS.map((option) => {
              const selected = selectedInterval === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSelectedInterval(option)}
                  className={`min-h-10 cursor-pointer rounded-lg px-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] ${
                    selected
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {intervalLabel(option)}
                </button>
              );
            })}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Sets the calendar grid. Availability people already shared stays as-is.
          </p>
        </div>

        <Field
          label="Fallback timezone"
          hint="Only used when a viewer's own timezone can't be detected."
        >
          <SelectInput
            value={selectedTimezone}
            onChange={(event) => setSelectedTimezone(event.target.value)}
          >
            <option value="">None — always use the viewer's timezone</option>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replace(/_/g, " ")}
              </option>
            ))}
          </SelectInput>
        </Field>

        <ErrorText message={error} />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!changed}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
