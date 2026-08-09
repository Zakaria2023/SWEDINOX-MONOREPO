"use client";

import Link from "next/link";
import { PurchaseReceivalItem } from "@/app/(dashboard)/purchase-receivals/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ORDER_LINE_STATUS_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  receivals: PurchaseReceivalItem[];
};

export const PurchaseReceivalsTable = ({ receivals }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="purchase-receivals-table"
          fileName="purchase-receivals"
          sheetName="Purchase receivals"
        />
      </div>
      <Table id="purchase-receivals-table">
        <TableHeader>
          <TableRow>
            <TableHead>Purchase order</TableHead>
            <TableHead className="text-right">Line</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Product code</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Line amount</TableHead>
            <TableHead className="text-right">Qty(p)</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Qty(a)</TableHead>
            <TableHead className="text-right">Received Qty</TableHead>
            <TableHead className="text-right">Invoiced</TableHead>
            <TableHead>Options</TableHead>
            <TableHead>Line status</TableHead>
            <TableHead>Receipt status</TableHead>
            <TableHead>Receipt date</TableHead>
            <TableHead>Delivery date (p)</TableHead>
            <TableHead>Delivery date (a)</TableHead>
            <TableHead className="text-right">Kg(p)</TableHead>
            <TableHead className="text-right">Kg(a)</TableHead>
            <TableHead>Purchaser</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receivals.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={20}
                className="h-24 text-center text-muted-foreground"
              >
                No purchase receivals found.
              </TableCell>
            </TableRow>
          ) : (
            receivals.map((row) => (
              <TableRow key={row.uuid}>
                <TableCell className="font-medium">
                  <Link
                    href={`/purchase-receivals/${row.uuid}`}
                    className="text-primary hover:underline"
                  >
                    {row.purchaseOrderCode ?? `Receipt #${row.id}`}
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  {row.lineNumber ?? "—"}
                </TableCell>
                <TableCell>{row.supplierName ?? "—"}</TableCell>
                <TableCell className="font-medium">
                  {row.productCode ?? "—"}
                </TableCell>
                <TableCell>{row.productName ?? "—"}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  € {row.lineAmount}
                </TableCell>
                <TableCell className="text-right">{row.qtyPlanned}</TableCell>
                <TableCell>
                  {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                </TableCell>
                <TableCell className="text-right">{row.qtyActual}</TableCell>
                <TableCell className="text-right">{row.receivedQty}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  € {row.invoicedPrice}
                </TableCell>
                <TableCell>{row.options ?? "—"}</TableCell>
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
                <TableCell>{row.receiptStatus ?? "—"}</TableCell>
                <TableCell>{row.receiptDate ?? "—"}</TableCell>
                <TableCell>{row.deliveryDatePlanned ?? "—"}</TableCell>
                <TableCell>{row.deliveryDateActual ?? "—"}</TableCell>
                <TableCell className="text-right">{row.kgPlanned}</TableCell>
                <TableCell className="text-right">{row.kgActual}</TableCell>
                <TableCell>{row.purchaser ?? "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
