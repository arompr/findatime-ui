import { useState } from "react";
import { Button } from "./ui/Button";
import { TextInput } from "./ui/TextInput";
import { ErrorText } from "./ui/ErrorText";

type JoinCodeFormProps = {
  loading: boolean;
  error?: string;
  onSubmit: (code: string) => void;
};

export function JoinCodeForm({ loading, error, onSubmit }: JoinCodeFormProps) {
  const [code, setCode] = useState("");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = code.trim();
        if (trimmed) onSubmit(trimmed);
      }}
    >
      <TextInput
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter event code"
        autoComplete="off"
        autoFocus
      />
      {error && <ErrorText message={error} />}
      <Button type="submit" loading={loading} disabled={!code.trim()}>
        Join
      </Button>
    </form>
  );
}
