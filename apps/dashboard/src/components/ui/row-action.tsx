import Link from "next/link";
import { ReactNode } from "react";

import { cn } from "@/lib/helpers";

// What the action does decides its colour: reading is the safe one, changing is
// the one to think about, removing is the one to be sure about. Each keeps its
// own hue across every table, so the icons are recognised rather than read.
const TONE_CLASS = {
  view: "text-primary hover:bg-primary/10",
  edit: "text-amber-600 hover:bg-amber-500/10",
  danger: "text-destructive hover:bg-destructive/10",
  neutral: "text-muted-foreground hover:bg-muted hover:text-foreground",
};

type RowActionTone = keyof typeof TONE_CLASS;

type RowActionProps = {
  /** Names the action for a reader who only sees the icon. */
  label: string;
  tone?: RowActionTone;
  /** Where it goes. Omit for a button and pass onClick instead. */
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

export const RowAction = ({
  label,
  tone = "neutral",
  href,
  onClick,
  disabled = false,
  className,
  children,
}: RowActionProps) => {
  const classes = cn(
    "inline-flex size-7 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50",
    TONE_CLASS[tone],
    className,
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(classes, "cursor-pointer")}
    >
      {children}
    </button>
  );
};
