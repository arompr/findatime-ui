import { forwardRef, type InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const inputClassName =
  "w-full min-h-11 rounded-lg border bg-card px-3.5 text-base text-foreground shadow-[inset_0_1px_1px_rgb(var(--shadow-color)/0.04)] transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground/70 focus:outline-none focus-visible:ring-4 disabled:opacity-60 sm:min-h-10 sm:text-sm";

export function inputStateClassName(invalid: boolean): string {
  return invalid
    ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/15"
    : "border-input hover:border-muted-foreground/50 focus-visible:border-brand focus-visible:ring-brand/15";
}

// 16px text below `sm` keeps iOS Safari from zooming into the field on focus.
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { invalid = false, className = "", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${inputClassName} ${inputStateClassName(invalid)} ${className}`}
      {...props}
    />
  );
});
