"use client";

import { TableHead } from "@/components/shadcn/table";
import { useTableQuery } from "@/hooks/use-table-query";
import { cn } from "@/lib/helpers";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  /** The key this column was declared sortable under. */
  sortKey: string;
  children: ReactNode;
  className?: string;
};

export const TableSortHeader = ({ sortKey, children, className }: Props) => {
  const { value, setParams, isPending } = useTableQuery();
  const active = value("sort") === sortKey;
  const dir = value("dir") === "desc" ? "desc" : "asc";

  // Clicking the column already sorted flips it; clicking a different one
  // starts ascending, which is the direction a reader assumes when they have
  // not asked for one.
  const toggle = () =>
    setParams({
      sort: sortKey,
      dir: active && dir === "asc" ? "desc" : "asc",
    });

  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead
      className={className}
      // aria-sort belongs to the column header itself, not to the control
      // inside it — a screen reader announces the column as sorted, then the
      // button as the way to change it.
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {children}
        <Icon className={cn("size-3.5", !active && "opacity-50")} />
      </button>
    </TableHead>
  );
};
