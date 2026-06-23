import * as React from "react";
import { cn } from "@/lib/helpers";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      className={cn("size-4 rounded border-border accent-primary", className)}
      {...props}
    />
  ),
);

Checkbox.displayName = "Checkbox";
