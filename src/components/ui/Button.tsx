import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:bg-primary/85 disabled:bg-primary/30 disabled:shadow-none",
  secondary:
    "border border-input bg-card text-foreground hover:bg-secondary disabled:text-muted-foreground",
  ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
  danger:
    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/85 disabled:bg-destructive/40",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-4 text-sm sm:min-h-10",
  sm: "min-h-10 px-3 text-sm sm:min-h-9",
  icon: "size-10 sm:size-9",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    children,
    className = "",
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,color,transform,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] disabled:cursor-default disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
