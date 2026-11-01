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

  return (
    <Modal title="Event settings" onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            timezone: selectedTimezone === "" ? null : selectedTimezone,
            intervalMinutes: selectedInterval,
          });
        }}
      >
        <Field label="Event timezone">
          <SelectInput
            value={selectedTimezone}
            onChange={(event) => setSelectedTimezone(event.target.value)}
          >
            <option value="">Off — use each viewer's timezone</option>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </SelectInput>
        </Field>
        <p className="-mt-2 text-xs text-slate-500">
          Used only as a fallback when a viewer's timezone isn't known.
        </p>

        <div role="group" aria-labelledby="event-interval-label">
          <span
            id="event-interval-label"
            className="mb-1 block text-sm text-slate-600"
          >
            Time slot length
          </span>
          <div className="grid grid-cols-3 gap-1 rounded-md border border-slate-300 p-1">
            {INTERVAL_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={selectedInterval === option}
                onClick={() => setSelectedInterval(option)}
                className={`cursor-pointer rounded px-2 py-2 text-sm font-medium ${
                  selectedInterval === option
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {intervalLabel(option)}
              </button>
            ))}
          </div>
        </div>
        <p className="-mt-2 text-xs text-slate-500">
          Changes the calendar's slot size. Availability that people already shared
          stays as-is.
        </p>

        <ErrorText message={error} />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
