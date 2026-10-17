import { WarehouseTreeRow } from "@/app/(dashboard)/warehouse-work-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateColumn, formatNumber, orDash } from "@/lib/helpers";
import { WAREHOUSE_WORK_ORDER_TYPE_LABELS } from "@/lib/labels";

type Props = {
  /** Every line of the work order the selection sits in. */
  rows: WarehouseTreeRow[];
};

type SupplierTotals = {
  supplier: string | null;
  plannedLines: number;
  plannedKg: number;
  plannedMeters: number;
  plannedPieces: number;
  readyLines: number;
  readyKg: number;
};

/**
 * The footer the reference prints under its warehouse tree for the selected
 * work order — `Magazijn opdracht 327402 (Lossen, 11-10-2026)` — with what was
 * planned beside what is done, one row per supplier: `Gepland` (Leverancier ·
 * #Regels · Gewicht · Meters · Stuks) and `Gereed` (#Regels · Gewicht).
 */
export const WorkOrderSummary = ({ rows }: Props) => {
  const first = rows[0];
  if (!first) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a line to see its work order.
      </p>
    );
  }

  // `Klant` on a sales work order, `Leverancier` on a purchase one
  // (O108309 picking against 327402 unloading, 16-10-2026).
  const isSales = first.type !== "unloading" && first.orderItemUuid !== null;

  const bySupplier = rows.reduce((totals, row) => {
    const key = row.companyName ?? "";
    const current = totals.get(key) ?? {
      supplier: row.companyName,
      plannedLines: 0,
      plannedKg: 0,
      plannedMeters: 0,
      plannedPieces: 0,
      readyLines: 0,
      readyKg: 0,
    };
    const pieces = Number(row.qtyPlanned ?? 0);
    const done = row.status === "approved" || row.status === "ready";
    totals.set(key, {
      ...current,
      plannedLines: current.plannedLines + 1,
      plannedKg: current.plannedKg + Number(row.kgPlanned ?? 0),
      plannedMeters:
        current.plannedMeters + (pieces * Number(row.length ?? 0)) / 1000,
      plannedPieces: current.plannedPieces + pieces,
      readyLines: current.readyLines + (done ? 1 : 0),
      readyKg: current.readyKg + (done ? Number(row.kgActual ?? 0) : 0),
    });
    return totals;
  }, new Map<string, SupplierTotals>());

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">
        Warehouse work order {first.workOrderNumber} (
        {WAREHOUSE_WORK_ORDER_TYPE_LABELS[first.type]},{" "}
        {formatDateColumn(first.plannedDate)})
      </h2>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead colSpan={5} className="border-e text-center">
                Planned
              </TableHead>
              <TableHead colSpan={2} className="text-center">
                Ready
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead>{isSales ? "Customer" : "Supplier"}</TableHead>
              <TableHead className="text-right">#Lines</TableHead>
              <TableHead className="text-right">Weight</TableHead>
              <TableHead className="text-right">Meters</TableHead>
              <TableHead className="border-e text-right">Pieces</TableHead>
              <TableHead className="text-right">#Lines</TableHead>
              <TableHead className="text-right">Weight</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...bySupplier.values()].map((totals) => (
              <TableRow key={totals.supplier ?? ""}>
                <TableCell>{orDash(totals.supplier)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {totals.plannedLines}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(totals.plannedKg)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(totals.plannedMeters)}
                </TableCell>
                <TableCell className="border-e text-right tabular-nums">
                  {formatNumber(totals.plannedPieces)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {totals.readyLines}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(totals.readyKg)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};
