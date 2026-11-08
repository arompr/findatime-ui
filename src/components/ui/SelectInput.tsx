import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { inputClassName, inputStateClassName } from "./TextInput";

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export function SelectInput({ invalid = false, className = "", ...props }: SelectInputProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={`${inputClassName} ${inputStateClassName(invalid)} cursor-pointer appearance-none pr-10 ${className}`}
        {...props}
      />
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}
