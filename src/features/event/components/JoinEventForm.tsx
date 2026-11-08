import { useState } from "react";
import { ArrowLeft } from "lucide-react";
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
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSubmit(name.trim());
      }}
    >
      {eventName && (
        <div className="flex items-start gap-2">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Use a different code"
              onClick={onBack}
              disabled={loading}
              className="-ml-2 -mt-1"
            >
              <ArrowLeft className="size-4" aria-hidden />
            </Button>
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              You're joining
            </p>
            <p className="truncate font-display text-xl font-semibold tracking-tight">
              {eventName}
            </p>
          </div>
        </div>
      )}
      <Field label="Your name" hint="Shown to everyone in this event.">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex"
          autoComplete="given-name"
          enterKeyHint="go"
          autoFocus
        />
      </Field>
      <ErrorText message={error} />
      <Button type="submit" loading={loading} disabled={!name.trim()} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
