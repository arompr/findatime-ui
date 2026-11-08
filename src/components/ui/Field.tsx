import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

type FieldProps = {
  label: string;
  /** Supporting text under the control. */
  hint?: ReactNode;
  error?: string;
  /** Optional trailing element on the label row (e.g. an info tooltip). */
  aside?: ReactNode;
  children: ReactElement<{ id?: string; "aria-describedby"?: string; invalid?: boolean }>;
};

/** Label + control + hint/error, wired together for screen readers. */
export function Field({ label, hint, error, aside, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        "aria-describedby": describedBy || undefined,
        invalid: children.props.invalid ?? Boolean(error),
      })
    : children;

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={children.props.id ?? id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {aside}
      </div>
      {control}
      {hint && !error && (
        <p id={hintId} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
