"use client";

import { ReceiptRow } from "@/app/(dashboard)/receipts/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

type Props = {
  rows: ReceiptRow[];
};

const number = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

export const ReceiptsTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Receipt date</TableHead>
          <TableHead>Company code</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Kg</TableHead>
          <TableHead>Order no</TableHead>
          <TableHead>Receipt status</TableHead>
          <TableHead className="text-right">Material still to receive</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={9}
              className="h-24 text-center text-muted-foreground"
            >
              No receipts found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.receiptDate ?? "—"}</TableCell>
              <TableCell>{row.companyCode ?? "—"}</TableCell>
              <TableCell className="font-medium">
                {row.companyName ?? "—"}
              </TableCell>
              <TableCell>
                {[row.productCode, row.productName].filter(Boolean).join(" — ") ||
                  "—"}
              </TableCell>
              <TableCell className="text-right">{number(row.qty)}</TableCell>
              <TableCell className="text-right">{number(row.kg)}</TableCell>
              <TableCell>{row.purchaseOrderCode ?? "—"}</TableCell>
              <TableCell>{row.receiptStatus ?? "—"}</TableCell>
              <TableCell className="text-right">
                {number(row.materialStillToReceive)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
