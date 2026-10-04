"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Button, buttonVariants } from "@/components/shadcn/button";
import { cn } from "@/lib/helpers";

/**
 * 🔴 An overview's actions live **above** the grid, not in a column at the end
 * of every row.
 *
 * That is how the reference does it, on every screen: a toolbar across the top
 * — `Show Product` · `Supplier` · `Purchase lines` · `Warehouse workorders` ·
 * `Production workorders` — and you pick a row first, then press the button.
 * There is no per-row button anywhere in it.
 *
 * It is also the only arrangement that survives a wide table. Purchase
 * receivals carries 25 columns; an Actions column at the end of them sits off
 * the right-hand edge of the screen, so the buttons were there and nobody could
 * reach them without scrolling past everything else first.
 *
 * An action with nowhere to go is disabled rather than hidden, so the screen
 * says what it can do before anything has been picked.
 */
export type TableRowActionItem = {
  label: string;
  icon: ReactNode;
  /** Where it goes for the selected row; null disables it. */
  href: string | null;
};

type Props = {
  actions: TableRowActionItem[];
  /** Names what the buttons would act on. */
  selectedLabel?: string | null;
};

export const TableRowToolbar = ({ actions, selectedLabel }: Props) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="me-1 text-sm text-muted-foreground">
      {selectedLabel ? (
        <>
          Selected: <span className="text-foreground">{selectedLabel}</span>
        </>
      ) : (
        "Select a row to act on it"
      )}
    </span>
    {actions.map((action) =>
      action.href ? (
        <Link
          key={action.label}
          href={action.href}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <span className="me-1.5">{action.icon}</span>
          {action.label}
        </Link>
      ) : (
        <Button key={action.label} variant="outline" size="sm" disabled>
          <span className="me-1.5">{action.icon}</span>
          {action.label}
        </Button>
      ),
    )}
  </div>
);
