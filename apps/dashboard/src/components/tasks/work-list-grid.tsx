import Link from "next/link";
import { WorkListRow } from "@/app/(dashboard)/tasks/actions";
import { cn } from "@/lib/helpers";
import { WORK_LIST_LABELS } from "@/lib/labels";

type Props = {
  rows: WorkListRow[];
};

// One card per worklist: how many are waiting, and a link to the screen that
// works them. An empty list stays on the page, dimmed, so the panel reads the
// same every day.
export const WorkListGrid = ({ rows }: Props) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {rows.map((row) => (
      <Link
        key={row.key}
        href={row.href}
        className={cn(
          "flex items-center justify-between gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/40",
          row.count === 0 && "text-muted-foreground",
        )}
      >
        <span className="text-sm font-medium">{WORK_LIST_LABELS[row.key]}</span>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-sm tabular-nums",
            row.count > 0
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {row.count}
        </span>
      </Link>
    ))}
  </div>
);
