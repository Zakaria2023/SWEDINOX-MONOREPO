"use client";

import { Paged } from "@/lib/table-query";

import Link from "next/link";
import { TablePagination } from "@/components/ui/table-pagination";
import { ReturnLineItem } from "@/app/(dashboard)/return-lines/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  RETURN_ORDER_REASON_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import { TableExportButton } from "@/components/ui/table-export-button";
import { GenerateReturnLinesButton } from "@/components/return-lines/generate-return-lines-button";

type Props = {
  page: Paged<ReturnLineItem>;
};

export const ReturnLinesTable = ({ page }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <TableExportButton
          tableId="return-lines-table"
          fileName="return-lines"
          sheetName="Return lines"
        />
        <GenerateReturnLinesButton />
      </div>
      <Table id="return-lines-table">
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">Return</TableHead>
            <TableHead className="text-right">Line</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Product code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Line status</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>QtyU</TableHead>
            <TableHead className="text-right">Return Qty</TableHead>
            <TableHead>Return reason</TableHead>
            <TableHead className="text-right">Net price</TableHead>
            <TableHead className="text-right">Cost price</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">Profit margin</TableHead>
            <TableHead>Delivery date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={17}
                className="h-24 text-center text-muted-foreground"
              >
                No return lines found.
              </TableCell>
            </TableRow>
          ) : (
            page.rows.map((row) => (
              <TableRow key={row.uuid}>
                <TableCell className="text-right font-medium">
                  <Link
                    href={`/return-lines/${row.uuid}`}
                    className="text-primary hover:underline"
                  >
                    {row.returnOrderId ?? `#${row.id}`}
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  {row.lineNumber ?? "—"}
                </TableCell>
                <TableCell>{row.reference ?? "—"}</TableCell>
                <TableCell>{row.customerName ?? "—"}</TableCell>
                <TableCell className="font-medium">
                  {row.productCode ?? "—"}
                </TableCell>
                <TableCell>{row.productName ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge
                    value={row.lineStatus}
                    label={
                      row.lineStatus
                        ? ORDER_LINE_STATUS_LABELS[row.lineStatus]
                        : null
                    }
                  />
                </TableCell>
                <TableCell className="text-right">{row.quantity}</TableCell>
                <TableCell>
                  {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                </TableCell>
                <TableCell className="text-right">{row.returnQty}</TableCell>
                <TableCell>
                  {row.returnReason
                    ? RETURN_ORDER_REASON_LABELS[row.returnReason]
                    : "—"}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  € {row.netPrice}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  € {row.costPrice}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  € {row.amount}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.profit)}
                </TableCell>
                <TableCell className="text-right">
                  {row.profitMargin.toFixed(1)}%
                </TableCell>
                <TableCell>{row.deliveryDate ?? "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
    <TablePagination page={page} singular="return line" plural="return lines" />
  </div>
);
