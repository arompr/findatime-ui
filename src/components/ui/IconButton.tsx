import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";
import type { Side } from "./floating";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** Accessible name, also shown as the tooltip. */
  label: string;
  icon: ReactNode;
  variant?: "secondary" | "ghost";
  tooltipSide?: Side;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = "ghost", tooltipSide, ...props },
  ref,
) {
  return (
    <Tooltip content={label} side={tooltipSide}>
      <Button ref={ref} variant={variant} size="icon" aria-label={label} {...props}>
        {icon}
      </Button>
    </Tooltip>
  );
});
