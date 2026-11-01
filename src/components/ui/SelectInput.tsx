import type { SelectHTMLAttributes } from "react";

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export function SelectInput({ invalid = false, className = "", ...props }: SelectInputProps) {
  return (
    <select
      className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 ${
        invalid
          ? "border-red-400 focus-visible:ring-red-300"
          : "border-slate-300 focus-visible:ring-slate-400"
      } ${className}`}
      {...props}
    />
  );
}
