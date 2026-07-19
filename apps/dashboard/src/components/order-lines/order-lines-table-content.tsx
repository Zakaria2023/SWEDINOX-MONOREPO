"use client";

import { OrderLineRow } from "@/app/(dashboard)/order-lines/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { OrderLineStatus } from "@/lib/enums";
import { ORDER_LINE_STATUS_LABELS } from "@/lib/labels";

type Props = {
  rows: OrderLineRow[];
};

const money = (value: number) =>
  `€ ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const number = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const fmtDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";

const lineStatusLabel = (value: OrderLineStatus | null) =>
  value ? (ORDER_LINE_STATUS_LABELS[value] ?? value) : "—";

export const OrderLinesTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Creation date</TableHead>
          <TableHead>Delivery date</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead className="text-right">Order</TableHead>
          <TableHead className="text-right">Line</TableHead>
          <TableHead>Line status</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Options</TableHead>
          <TableHead className="text-right">Length (mm)</TableHead>
          <TableHead className="text-right">Width (mm)</TableHead>
          <TableHead className="text-right">Thick. (mm)</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>QtyU</TableHead>
          <TableHead className="text-right">Weight (kg)</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Cost price</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Profit</TableHead>
          <TableHead className="text-right">Profit margin</TableHead>
          <TableHead>Seller</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={22}
              className="h-24 text-center text-muted-foreground"
            >
              No order lines found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="whitespace-nowrap">
                {fmtDate(row.createdAt)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {fmtDate(row.deliveryDate)}
              </TableCell>
              <TableCell className="font-medium">
                {row.customerName ?? "—"}
              </TableCell>
              <TableCell>{row.reference ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.orderId ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.lineNumber ?? "—"}
              </TableCell>
              <TableCell>{lineStatusLabel(row.lineStatus)}</TableCell>
              <TableCell className="whitespace-nowrap">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.description ?? "—"}</TableCell>
              <TableCell>{row.options ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.lengthMm ?? "—"}
              </TableCell>
              <TableCell className="text-right">{row.widthMm ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.thicknessMm ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {number(row.quantity)}
              </TableCell>
              <TableCell>{row.unit?.toUpperCase() ?? "—"}</TableCell>
              <TableCell className="text-right">
                {number(row.weightKg)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.price)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.costPrice)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.amount)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.profit)}
              </TableCell>
              <TableCell className="text-right">
                {number(row.profitMargin)}%
              </TableCell>
              <TableCell>{row.seller ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
