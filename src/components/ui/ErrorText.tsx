import { CircleAlert } from "lucide-react";

type ErrorTextProps = {
  message?: string;
};

export function ErrorText({ message }: ErrorTextProps) {
  if (!message) return null;
  return (
    <p
      className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2.5 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200"
      role="alert"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}
