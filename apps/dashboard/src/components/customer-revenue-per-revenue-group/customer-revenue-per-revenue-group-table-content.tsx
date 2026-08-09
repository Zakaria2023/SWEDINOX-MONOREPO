"use client";

import { CustomerRevenuePerRevenueGroupRow } from "@/app/(dashboard)/customer-revenue-per-revenue-group/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatMoney, formatNumber } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: CustomerRevenuePerRevenueGroupRow[];
};

export const CustomerRevenuePerRevenueGroupTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="customer-revenue-per-revenue-group-table"
          fileName="customer-revenue-per-revenue-group"
          sheetName="Customer revenue per revenue group"
        />
      </div>
      <Table id="customer-revenue-per-revenue-group-table">
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">Debtor number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>City</TableHead>
            <TableHead className="text-right">Revenue group</TableHead>
            <TableHead>Revenue group name</TableHead>
            <TableHead className="text-right">Year</TableHead>
            <TableHead className="text-right">Month</TableHead>
            <TableHead className="text-right">Weight (kg)</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="h-24 text-center text-muted-foreground"
              >
                No customer revenue found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="text-right">
                  {row.customerCode ?? "—"}
                </TableCell>
                <TableCell className="font-medium">
                  {row.customerName ?? "—"}
                </TableCell>
                <TableCell>{row.city ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.revenueGroupNumber ?? "—"}
                </TableCell>
                <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
                <TableCell className="text-right">{row.year ?? "—"}</TableCell>
                <TableCell className="text-right">{row.month ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.weightKg)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.revenue)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
