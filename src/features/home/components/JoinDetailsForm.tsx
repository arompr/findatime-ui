import { useState } from "react";
import { Button } from "./ui/Button";
import { TextInput } from "./ui/TextInput";
import { Field } from "./ui/Field";
import { ErrorText } from "./ui/ErrorText";

type JoinDetailsFormProps = {
  eventName: string;
  loading: boolean;
  error?: string;
  onBack: () => void;
  onSubmit: (participantName: string) => void;
};

export function JoinDetailsForm({
  eventName,
  loading,
  error,
  onBack,
  onSubmit,
}: JoinDetailsFormProps) {
  const [name, setName] = useState("");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSubmit(name.trim());
      }}
    >
      <p className="text-sm text-slate-500">
        Joining <span className="font-medium text-slate-900">{eventName}</span>
      </p>
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
      <Button type="submit" loading={loading} disabled={!name.trim()}>
        Join event
      </Button>
      <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>
        Use a different code
      </Button>
    </form>
  );
}
