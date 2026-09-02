"use client";

import { CombinedWorkOrderLine } from "@/app/(dashboard)/warehouse-and-production-workorders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { cn, formatDateColumn, formatNumber, orDash } from "@/lib/helpers";
import {
  WORK_ORDER_STATUS_LABELS,
  TRANSPORT_WORK_ORDER_STATUS_LABELS,
} from "@/lib/labels";

// The list merges two kinds of work order, and the warehouse ladder is not the
// production one — so a status is looked up in both vocabularies. They agree on
// the one value they share, "new".
const STATUS_LABELS: Record<string, string> = {
  ...TRANSPORT_WORK_ORDER_STATUS_LABELS,
  ...WORK_ORDER_STATUS_LABELS,
};
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: CombinedWorkOrderLine[];
};

export const WarehouseAndProductionWorkOrdersTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="warehouse-and-production-workorders-table"
          fileName="warehouse-and-production-workorders"
          sheetName="Warehouse- and production workorders"
        />
      </div>
      <Table id="warehouse-and-production-workorders-table">
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">Workorder #</TableHead>
            <TableHead className="text-right">Line #</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead className="text-right">Qty(p)</TableHead>
            <TableHead className="text-right">Qty(a)</TableHead>
            <TableHead>QtyU</TableHead>
            <TableHead className="text-right">Kg(p)</TableHead>
            <TableHead className="text-right">Kg(a)</TableHead>
            <TableHead className="text-right">Weight deviation</TableHead>
            <TableHead>Workorder type</TableHead>
            <TableHead>Workorder date</TableHead>
            <TableHead>Workorder status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={12}
                className="h-24 text-center text-muted-foreground"
              >
                No workorder lines found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.uuid}>
                <TableCell className="text-right font-medium tabular-nums">
                  {row.workOrderNumber}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.lineNumber}
                </TableCell>
                <TableCell>{orDash(row.warehouseName)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.qtyPlanned)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.qtyActual)}
                </TableCell>
                <TableCell>{orDash(row.qtyUnit)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.kgPlanned)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.kgActual)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    // A short delivery is the one worth noticing: it means the
                    // floor reported less weight than the plan called for.
                    row.weightDeviation < 0 && "text-destructive",
                  )}
                >
                  {formatNumber(row.weightDeviation)}
                </TableCell>
                <TableCell>{row.workOrderType}</TableCell>
                <TableCell>{formatDateColumn(row.workOrderDate)}</TableCell>
                <TableCell>
                  {row.workOrderStatus
                    ? (STATUS_LABELS[row.workOrderStatus] ??
                      row.workOrderStatus)
                    : "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
