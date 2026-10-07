import { TableCell } from "@/components/shadcn/table";
import { ExportCellValue } from "@/lib/excel";
import { cn, formatDateColumn, formatNumber } from "@/lib/helpers";

type Props = {
  value: ExportCellValue;
  className?: string;
};

/**
 * A table cell drawn from a column's export value.
 *
 * Most reference columns are a plain figure, date or word, and their
 * `columns.ts` entry already says how a row turns into one. Rendering that
 * value here means a column added to the declaration appears on screen without
 * a hand-written cell — numbers right-aligned, dates in the column format,
 * nothing as an em dash. Columns that link or badge keep their own cell.
 */
export const ExportValueCell = ({ value, className }: Props) => {
  if (value === null || value === "") {
    return <TableCell className={cn("text-muted-foreground", className)}>—</TableCell>;
  }
  if (typeof value === "number") {
    return (
      <TableCell className={cn("text-right tabular-nums", className)}>
        {formatNumber(value)}
      </TableCell>
    );
  }
  if (value instanceof Date) {
    return (
      <TableCell className={cn("whitespace-nowrap", className)}>
        {formatDateColumn(value)}
      </TableCell>
    );
  }
  if (typeof value === "boolean") {
    return <TableCell className={className}>{value ? "Yes" : "No"}</TableCell>;
  }
  return <TableCell className={className}>{value}</TableCell>;
};
