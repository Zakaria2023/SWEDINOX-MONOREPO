import { TableCell, TableRow } from "@/components/shadcn/table";

type Props = {
  /** What the grid is grouped by, e.g. "Status". */
  label: string;
  value: string;
  count: number;
  colSpan: number;
};

/**
 * The header of one group in a grouped overview — the reference's
 * "Status: Delivered (3)" band above the rows that share that value. The
 * count is of the rows on this page.
 */
export const TableGroupRow = ({ label, value, count, colSpan }: Props) => (
  <TableRow className="bg-muted/50 hover:bg-muted/50">
    <TableCell colSpan={colSpan} className="text-sm font-medium">
      {label}: {value}{" "}
      <span className="font-normal text-muted-foreground">({count})</span>
    </TableCell>
  </TableRow>
);
