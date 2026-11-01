import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Field } from "@/components/ui/Field";
import { ErrorText } from "@/components/ui/ErrorText";

type JoinEventFormProps = {
  /** When set, a "Joining <name>" line introduces the form. */
  eventName?: string;
  loading: boolean;
  error?: string;
  submitLabel?: string;
  onBack?: () => void;
  onSubmit: (name: string) => void;
};

export function JoinEventForm({
  eventName,
  loading,
  error,
  submitLabel = "Join event",
  onBack,
  onSubmit,
}: JoinEventFormProps) {
  const [name, setName] = useState("");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSubmit(name.trim());
      }}
    >
      {eventName && (
        <p className="text-sm text-slate-500">
          Joining <span className="font-medium text-slate-900">{eventName}</span>
        </p>
      )}
      <Field label="Your name">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex"
          autoComplete="name"
          autoFocus
        />
      </Field>
      {error && <ErrorText message={error} />}
      <Button type="submit" loading={loading} disabled={!name.trim()} className="w-full sm:w-auto">
        {submitLabel}
      </Button>
      {onBack && (
        <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>
          Use a different code
        </Button>
      )}
    </form>
  );
}
