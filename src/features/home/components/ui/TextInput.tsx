import type { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function TextInput({ invalid = false, className = "", ...props }: TextInputProps) {
  return (
    <input
      className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 ${
        invalid
          ? "border-red-400 focus-visible:ring-red-300"
          : "border-slate-300 focus-visible:ring-slate-400"
      } ${className}`}
      {...props}
    />
  );
}
