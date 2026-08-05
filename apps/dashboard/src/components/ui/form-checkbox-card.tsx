import { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/helpers";

type FormCheckboxCardProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "type"
> & {
  active?: boolean;
  checkboxClassName?: string;
  label: ReactNode;
  labelClassName?: string;
};

export const FormCheckboxCard = ({
  active = false,
  checkboxClassName,
  className,
  label,
  labelClassName,
  ...inputProps
}: FormCheckboxCardProps) => (
  <label
    className={cn(
      "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors",
      active
        ? "border-primary bg-primary/5"
        : "border-border bg-background hover:bg-accent/40",
      className,
    )}
  >
    <input
      type="checkbox"
      className={cn(
        "mt-0.5 h-4 w-4 rounded border-border accent-primary",
        checkboxClassName,
      )}
      {...inputProps}
    />
    <span className={cn("text-sm font-medium text-foreground", labelClassName)}>
      {label}
    </span>
  </label>
);
