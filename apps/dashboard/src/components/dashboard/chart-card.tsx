import { ReactNode } from "react";

import { cn } from "@/lib/helpers";

type ChartCardProps = {
  title: string;
  description?: string;
  /** Sits under the plot — a note on what the figures are read from. */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

export const ChartCard = ({
  title,
  description,
  footer,
  className,
  children,
}: ChartCardProps) => (
  <section className={cn("rounded-md border p-4", className)}>
    <div className="space-y-1">
      <h2 className="text-sm font-medium tracking-tight">{title}</h2>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
    <div className="mt-4">{children}</div>
    {footer && (
      <div className="mt-3 text-xs text-muted-foreground">{footer}</div>
    )}
  </section>
);
