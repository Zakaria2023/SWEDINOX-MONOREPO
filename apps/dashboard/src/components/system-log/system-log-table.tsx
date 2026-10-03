import Link from "next/link";
import { SystemLogRow } from "@/app/(dashboard)/system-log/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableExportButton } from "@/components/ui/table-export-button";
import { SystemLogCategory, systemLogCategories } from "@/lib/enums";
import { cn, userName } from "@/lib/helpers";
import { SYSTEM_LOG_CATEGORY_LABELS } from "@/lib/labels";

type Props = {
  rows: SystemLogRow[];
  selected: SystemLogCategory | null;
  /** Clerk id -> name; a null user is the system itself. */
  userNames: Record<string, string>;
};

type FilterLinkProps = {
  href: string;
  label: string;
  active: boolean;
};

const FilterLink = ({ href, label, active }: FilterLinkProps) => (
  <Link
    href={href}
    className={cn(
      "rounded-full border px-3 py-1 text-xs transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border text-muted-foreground hover:bg-muted/40",
    )}
  >
    {label}
  </Link>
);

export const SystemLogTable = ({ rows, selected, userNames }: Props) => (
  <div className="space-y-4">
    <div className="flex flex-wrap gap-2">
      <FilterLink href="/system-log" label="All" active={selected === null} />
      {systemLogCategories.map((category) => (
        <FilterLink
          key={category}
          href={`/system-log?category=${category}`}
          label={SYSTEM_LOG_CATEGORY_LABELS[category]}
          active={selected === category}
        />
      ))}
    </div>
    <div className="flex justify-end">
      <TableExportButton
        tableId="system-log-table"
        fileName="errors"
        sheetName="Errors"
      />
    </div>
    <Table id="system-log-table">
      <TableHeader>
        <TableRow>
          <TableHead>Creation date</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Error message</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Order</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="h-24 text-center text-muted-foreground"
            >
              Nothing has been logged yet.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="whitespace-nowrap">
                {row.createdAt.toLocaleString("en-GB")}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {row.userId ? userName(row.userId, userNames) : "System"}
              </TableCell>
              <TableCell>{row.message}</TableCell>
              <TableCell className="whitespace-nowrap">
                {SYSTEM_LOG_CATEGORY_LABELS[row.category]}
              </TableCell>
              <TableCell className="text-right">
                {row.orderUuid && row.orderId !== null ? (
                  <Link
                    href={`/orders/${row.orderUuid}`}
                    className="text-primary hover:underline"
                  >
                    #{row.orderId}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
