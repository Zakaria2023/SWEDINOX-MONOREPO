"use client";

import { CostPriceToBeSentRow } from "@/app/(dashboard)/cost-price-invoices-to-be-sent/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateValue, formatMoney } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: CostPriceToBeSentRow[];
};

export const CostPriceInvoicesToBeSentTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="cost-price-invoices-to-be-sent-table"
          fileName="cost-price-invoices-to-be-sent"
          sheetName="Cost Price for Selling of Invoices to Be Sent"
        />
      </div>
      <Table id="cost-price-invoices-to-be-sent-table">
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Order</TableHead>
            <TableHead className="text-right">Line</TableHead>
            <TableHead>Goods issue date</TableHead>
            <TableHead className="text-right">Cost centre</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                No cost-price entries found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>{row.account}</TableCell>
                <TableCell className="text-right">
                  {formatMoney(row.amount)}
                </TableCell>
                <TableCell className="font-medium">
                  {row.orderReference}
                </TableCell>
                <TableCell className="text-right">
                  {row.lineNumber ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.goodsIssueDate)}
                </TableCell>
                <TableCell className="text-right">{row.costCentre}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
