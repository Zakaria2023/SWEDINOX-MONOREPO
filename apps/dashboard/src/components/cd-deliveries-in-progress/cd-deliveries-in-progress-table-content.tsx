"use client";

import { CdDeliveryRow } from "@/app/(dashboard)/cd-deliveries-in-progress/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { STOCK_UNIT_LABELS } from "@/lib/labels";
import { formatDateValue, formatMoney, formatNumber } from "@/lib/helpers";

type Props = {
  rows: CdDeliveryRow[];
};

export const CdDeliveriesInProgressTable = ({ rows }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead className="text-right">Line</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Product description</TableHead>
          <TableHead>Delivery date</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead className="text-right">Weight (kg)</TableHead>
          <TableHead className="text-right">Stock value</TableHead>
          <TableHead className="text-right">Purchase value</TableHead>
          <TableHead className="text-right">Purchase value diff.</TableHead>
          <TableHead className="text-right">Purchase order</TableHead>
          <TableHead className="text-right">Purchase order line</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={13}
              className="h-24 text-center text-muted-foreground"
            >
              No CD-deliveries in progress.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-medium">{row.orderId}</TableCell>
              <TableCell className="text-right">
                {row.lineNumber ?? "—"}
              </TableCell>
              <TableCell>{row.productCode ?? "—"}</TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.deliveryDate)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(Number(row.quantity ?? 0))}
              </TableCell>
              <TableCell>
                {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(Number(row.weightKg ?? 0))}
              </TableCell>
              <TableCell className="text-right">
                {formatMoney(row.stockValue)}
              </TableCell>
              <TableCell className="text-right">
                {formatMoney(row.purchaseValue)}
              </TableCell>
              <TableCell className="text-right">
                {formatMoney(row.purchaseValueDifference)}
              </TableCell>
              <TableCell className="text-right">
                {row.purchaseOrderId ?? "—"}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                —
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
