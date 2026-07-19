"use client";

import { OrderLineToCallRow } from "@/app/(dashboard)/order-lines-still-to-be-called/actions";
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
  rows: OrderLineToCallRow[];
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

export const OrderLinesStillToBeCalledTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Revenue group</TableHead>
          <TableHead>Our reference</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Order line</TableHead>
          <TableHead className="text-right">Order</TableHead>
          <TableHead className="text-right">Customer code</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Line status</TableHead>
          <TableHead>Delivery date</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>QtyU</TableHead>
          <TableHead className="text-right">Length (mm)</TableHead>
          <TableHead className="text-right">Width (mm)</TableHead>
          <TableHead className="text-right">Weight (kg)</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Quantity not called</TableHead>
          <TableHead className="text-right">Weight to be called</TableHead>
          <TableHead className="text-right">Amount to be called</TableHead>
          <TableHead>Representative</TableHead>
          <TableHead className="text-center">Consignment</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={23}
              className="h-24 text-center text-muted-foreground"
            >
              No order lines still to be called.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
              <TableCell>{row.ourReference ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.description ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.lineNumber ?? "—"}
              </TableCell>
              <TableCell className="text-right">{row.orderId ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.customerCode ?? "—"}
              </TableCell>
              <TableCell className="font-medium">
                {row.customerName ?? "—"}
              </TableCell>
              <TableCell>{row.city ?? "—"}</TableCell>
              <TableCell>{row.reference ?? "—"}</TableCell>
              <TableCell>{lineStatusLabel(row.lineStatus)}</TableCell>
              <TableCell className="whitespace-nowrap">
                {fmtDate(row.deliveryDate)}
              </TableCell>
              <TableCell className="text-right">
                {number(row.quantity)}
              </TableCell>
              <TableCell>{row.unit?.toUpperCase() ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.lengthMm ?? "—"}
              </TableCell>
              <TableCell className="text-right">{row.widthMm ?? "—"}</TableCell>
              <TableCell className="text-right">
                {number(row.weightKg)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.amount)}
              </TableCell>
              <TableCell className="text-right">
                {number(row.quantityNotCalled)}
              </TableCell>
              <TableCell className="text-right">
                {number(row.weightToBeCalled)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.amountToBeCalled)}
              </TableCell>
              <TableCell>{row.representative ?? "—"}</TableCell>
              <TableCell className="text-center">
                {row.consignment ? "✓" : ""}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
