"use client";

import { CustomerRevenueRow } from "@/app/(dashboard)/customer-revenue/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatMoney, formatNumber, yesNo } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: CustomerRevenueRow[];
};

export const CustomerRevenueTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="customer-revenue-table"
          fileName="customer-revenue"
          sheetName="Customer revenue"
        />
      </div>
      <Table id="customer-revenue-table">
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">Customer code</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Year</TableHead>
            <TableHead className="text-right">Month</TableHead>
            <TableHead className="text-right">Revenue of material</TableHead>
            <TableHead className="text-right">Revenue options</TableHead>
            <TableHead className="text-right">Revenue surcharges</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Profit material</TableHead>
            <TableHead className="text-right">Profit options</TableHead>
            <TableHead className="text-right">Profit surcharges</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">Profit margin</TableHead>
            <TableHead className="text-right">Kg</TableHead>
            <TableHead className="text-right">#Invoices</TableHead>
            <TableHead className="text-right">#Invoice lines</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={19}
                className="h-24 text-center text-muted-foreground"
              >
                No customer revenue found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {row.customerName ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.customerCode ?? "—"}
                </TableCell>
                <TableCell>{row.city ?? "—"}</TableCell>
                <TableCell>{row.country ?? "—"}</TableCell>
                <TableCell>{yesNo(row.active)}</TableCell>
                <TableCell className="text-right">{row.year}</TableCell>
                <TableCell className="text-right">{row.month}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.materialRevenue)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.optionsRevenue)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.surchargesRevenue)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-medium">
                  {formatMoney(row.revenue)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.materialProfit)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.optionsProfit)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.surchargesProfit)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-medium">
                  {formatMoney(row.profit)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.profitMargin)}%
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.weightKg)}
                </TableCell>
                <TableCell className="text-right">{row.invoices}</TableCell>
                <TableCell className="text-right">{row.invoiceLines}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
