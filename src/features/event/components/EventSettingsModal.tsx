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
import {
  DAY_END_HOUR_OPTIONS,
  DAY_START_HOUR_OPTIONS,
  hourLabel,
} from "@/lib/dayWindow";

export type EventSettingsInput = {
  timezone: string | null;
  intervalMinutes: IntervalMinutes;
  dayStartHour: number;
  dayEndHour: number;
};

type EventSettingsModalProps = {
  timezone: string | null;
  intervalMinutes: IntervalMinutes;
  dayStartHour: number;
  dayEndHour: number;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onSave: (input: EventSettingsInput) => void;
};

export function EventSettingsModal({
  timezone,
  intervalMinutes,
  dayStartHour,
  dayEndHour,
  loading,
  error,
  onClose,
  onSave,
}: EventSettingsModalProps) {
  const [selectedTimezone, setSelectedTimezone] = useState(timezone ?? "");
  const [selectedInterval, setSelectedInterval] = useState<IntervalMinutes>(
    intervalMinutes,
  );
  const [selectedStart, setSelectedStart] = useState(dayStartHour);
  const [selectedEnd, setSelectedEnd] = useState(dayEndHour);
  const zones = useMemo(() => timezoneOptions(timezone), [timezone]);
  const windowValid = selectedStart < selectedEnd;
  const changed =
    selectedInterval !== intervalMinutes ||
    selectedTimezone !== (timezone ?? "") ||
    selectedStart !== dayStartHour ||
    selectedEnd !== dayEndHour;

  return (
    <Modal title="Event settings" onClose={onClose}>
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            timezone: selectedTimezone === "" ? null : selectedTimezone,
            intervalMinutes: selectedInterval,
            dayStartHour: selectedStart,
            dayEndHour: selectedEnd,
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

        <div role="group" aria-labelledby="event-window-label" className="flex flex-col gap-1.5">
          <span id="event-window-label" className="text-sm font-medium">
            Calendar hours
          </span>
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <SelectInput
                aria-label="Calendar starts at"
                value={selectedStart}
                onChange={(event) => setSelectedStart(Number(event.target.value))}
              >
                {DAY_START_HOUR_OPTIONS.map((hour) => (
                  <option key={hour} value={hour}>
                    {hourLabel(hour)}
                  </option>
                ))}
              </SelectInput>
            </div>
            <span className="text-sm text-muted-foreground" aria-hidden>
              to
            </span>
            <div className="min-w-0 flex-1">
              <SelectInput
                aria-label="Calendar ends at"
                invalid={!windowValid}
                value={selectedEnd}
                onChange={(event) => setSelectedEnd(Number(event.target.value))}
              >
                {DAY_END_HOUR_OPTIONS.map((hour) => (
                  <option key={hour} value={hour}>
                    {hourLabel(hour)}
                  </option>
                ))}
              </SelectInput>
            </div>
          </div>
          {windowValid ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Hours shown on the calendar, in the timezone below (UTC when none is set).
              Availability outside them is kept, just hidden.
            </p>
          ) : (
            <ErrorText message="The end time must be after the start time." />
          )}
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
          <Button type="submit" loading={loading} disabled={!changed || !windowValid}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
