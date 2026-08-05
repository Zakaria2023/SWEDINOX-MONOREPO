"use client";

import { OrderStillToCallRow } from "@/app/(dashboard)/orders-still-to-be-called/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateValue, formatMoney, formatNumber, orderLineStatusLabel } from "@/lib/helpers";

type Props = {
  rows: OrderStillToCallRow[];
};

export const OrdersStillToBeCalledTable = ({ rows }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Order</TableHead>
          <TableHead>Our reference</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Order line</TableHead>
          <TableHead className="text-right">Customer code</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Line status</TableHead>
          <TableHead>Delivery date</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>QtyU</TableHead>
          <TableHead className="text-right">Weight (kg)</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Quantity not called</TableHead>
          <TableHead className="text-right">Weight to be called</TableHead>
          <TableHead className="text-right">Amount to be called</TableHead>
          <TableHead>Representative</TableHead>
          <TableHead className="text-center">Consignment</TableHead>
          <TableHead>Revenue group</TableHead>
          <TableHead className="text-right">Stock (kg)</TableHead>
          <TableHead className="text-right">Reserved stock</TableHead>
          <TableHead className="text-right">Cost price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={24}
              className="h-24 text-center text-muted-foreground"
            >
              No orders still to be called.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="text-right">{row.orderId ?? "—"}</TableCell>
              <TableCell>{row.ourReference ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.description ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.lineNumber ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.customerCode ?? "—"}
              </TableCell>
              <TableCell className="font-medium">
                {row.customerName ?? "—"}
              </TableCell>
              <TableCell>{row.city ?? "—"}</TableCell>
              <TableCell>{row.reference ?? "—"}</TableCell>
              <TableCell>{orderLineStatusLabel(row.lineStatus)}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.deliveryDate)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.quantity)}
              </TableCell>
              <TableCell>{row.unit?.toUpperCase() ?? "—"}</TableCell>
              <TableCell className="text-right">
                {formatNumber(row.weightKg)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.amount)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.quantityNotCalled)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.weightToBeCalled)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.amountToBeCalled)}
              </TableCell>
              <TableCell>{row.representative ?? "—"}</TableCell>
              <TableCell className="text-center">
                {row.consignment ? "✓" : ""}
              </TableCell>
              <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
              <TableCell className="text-right">{formatNumber(row.stockKg)}</TableCell>
              <TableCell className="text-right">
                {formatNumber(row.reservedStock)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.costPrice)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
