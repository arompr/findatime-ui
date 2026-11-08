import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { ErrorText } from "@/components/ui/ErrorText";

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
      <label htmlFor="event-code" className="text-sm font-medium">
        Join with a code or link
      </label>
      <div className="flex gap-2">
        <TextInput
          id="event-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste a code or link"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          invalid={Boolean(error)}
          aria-describedby={error ? "event-code-error" : undefined}
        />
        <Button
          type="submit"
          loading={loading}
          disabled={!code.trim()}
          aria-label="Find event"
          className="px-3.5 sm:px-4"
        >
          {!loading && <ArrowRight className="size-4" aria-hidden />}
          <span className="hidden sm:inline">Join</span>
        </Button>
      </div>
      {error && (
        <div id="event-code-error">
          <ErrorText message={error} />
        </div>
      )}
    </form>
  );
}
