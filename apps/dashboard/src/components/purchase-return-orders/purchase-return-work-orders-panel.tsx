"use client";

import Link from "next/link";
import { useState } from "react";
import { PurchaseReturnWorkOrderLine } from "@/app/(dashboard)/purchase-return-orders/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { BooleanFlag } from "@/components/ui/boolean-flag";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  cn,
  formatDateColumn,
  formatNumber,
  orDash,
  pluralize,
} from "@/lib/helpers";
import {
  WAREHOUSE_WORK_ORDER_TYPE_LABELS,
  WORK_ORDER_STATUS_LABELS,
} from "@/lib/labels";

const COLUMNS = [
  "Item",
  "Workorder",
  "Line",
  "Workorder date",
  "Type",
  "Status",
  "Product",
  "Description",
  "Length",
  "Width",
  "Qty (p)",
  "U (p)",
  "Kg (p)",
  "Qty checked",
  "Qty (a)",
  "U (a)",
  "Kg checked",
  "Kg (a)",
  "From",
  "To",
  "Date finished",
  "Charge",
  "Purchase order",
  "Receipt date",
];

type Props = {
  lines: PurchaseReturnWorkOrderLine[];
};

/**
 * `Workorders → Warehouse workorders` on a return: the picking `Make final`
 * raised, line by line, in the reference's columns (950034 → 327403,
 * 11-10-2026). Read-only — New and Delete are greyed there too.
 */
export const PurchaseReturnWorkOrdersPanel = ({ lines }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedProduct =
    lines.find((line) => line.uuid === selected)?.productUuid ?? null;

  return (
    <CollapsibleSection
      title="Warehouse workorders"
      summary={pluralize(lines.length, "line")}
      defaultOpen={lines.length > 0}
    >
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 px-2 py-1">
          <Button type="button" variant="ghost" size="sm" disabled>
            New
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled>
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            disabled={!selectedProduct}
            render={
              <Link
                href={selectedProduct ? `/products/${selectedProduct}` : "#"}
              />
            }
          >
            Show product
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {COLUMNS.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COLUMNS.length}
                    className="text-muted-foreground"
                  >
                    None — Make final raises the picking.
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line, index) => (
                  <TableRow
                    key={line.uuid}
                    onClick={() => setSelected(line.uuid)}
                    className={cn(
                      "cursor-pointer",
                      line.uuid === selected && "bg-accent",
                    )}
                  >
                    <TableCell className="text-right tabular-nums">
                      {(index + 1) * 10}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/warehouse-work-orders/${line.workOrderUuid}`}
                        className="text-primary hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {line.number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(line.lineNumber)}
                    </TableCell>
                    <TableCell>{formatDateColumn(line.plannedDate)}</TableCell>
                    <TableCell>
                      {WAREHOUSE_WORK_ORDER_TYPE_LABELS[line.type]}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={line.lineStatus}
                        label={WORK_ORDER_STATUS_LABELS[line.lineStatus]}
                      />
                    </TableCell>
                    <TableCell>{orDash(line.productCode)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {orDash(line.productName)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(line.length)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(line.width)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(line.qtyPlanned ?? 0))}
                    </TableCell>
                    <TableCell>
                      {orDash(line.unit ? line.unit.toUpperCase() : null)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(line.kgPlanned ?? 0))}
                    </TableCell>
                    <TableCell>
                      {/* Unticked on 327403 after it was reported: nothing
                          records that check yet. */}
                      <BooleanFlag on={false} label="Qty checked" />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(line.qtyActual ?? 0))}
                    </TableCell>
                    <TableCell>
                      {line.qtyActual !== null && line.unit
                        ? line.unit.toUpperCase()
                        : "-leeg-"}
                    </TableCell>
                    <TableCell>
                      <BooleanFlag on={false} label="Kg checked" />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(line.kgActual ?? 0))}
                    </TableCell>
                    <TableCell>{orDash(line.fromLocation)}</TableCell>
                    <TableCell>{orDash(line.toLocation)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateColumn(line.finishedAt)}
                    </TableCell>
                    <TableCell>{orDash(line.charge)}</TableCell>
                    <TableCell>
                      {line.purchaseOrderId !== null
                        ? `IO${line.purchaseOrderId}`
                        : "—"}
                    </TableCell>
                    <TableCell>{formatDateColumn(line.receiptDate)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </CollapsibleSection>
  );
};
