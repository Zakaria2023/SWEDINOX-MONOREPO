"use client";

import { Paged } from "@/lib/table-query";

import { TablePagination } from "@/components/ui/table-pagination";
import { OrderLineToCallRow } from "@/app/(dashboard)/order-lines-still-to-be-called/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  formatDateValue,
  formatMoney,
  formatNumber,
  orderLineStatusLabel,
} from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  page: Paged<OrderLineToCallRow>;
};

export const OrderLinesStillToBeCalledTable = ({ page }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="order-lines-still-to-be-called-table"
          fileName="order-lines-still-to-be-called"
          sheetName="Order lines still to be called"
        />
      </div>
      <Table id="order-lines-still-to-be-called-table">
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
          {page.rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={23}
                className="h-24 text-center text-muted-foreground"
              >
                No order lines still to be called.
              </TableCell>
            </TableRow>
          ) : (
            page.rows.map((row, index) => (
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
                <TableCell className="text-right">
                  {row.orderId ?? "—"}
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
                  {row.lengthMm ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.widthMm ?? "—"}
                </TableCell>
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
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
    <TablePagination page={page} singular="line" plural="lines" />
  </div>
);
