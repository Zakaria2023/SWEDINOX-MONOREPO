"use client";

import { CustomerRevenuePerProductGroupRow } from "@/app/(dashboard)/customer-revenue-per-product-group/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  customerGroupLabel,
  formatMoney,
  formatNumber,
  salesRepresentativeLabel,
} from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: CustomerRevenuePerProductGroupRow[];
};

export const CustomerRevenuePerProductGroupTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="customer-revenue-per-product-group-table"
          fileName="customer-revenue-per-product-group"
          sheetName="Customer revenue per product group"
        />
      </div>
      <Table id="customer-revenue-per-product-group-table">
        <TableHeader>
          <TableRow>
            <TableHead>Representative</TableHead>
            <TableHead>Customer group</TableHead>
            <TableHead className="text-right">Debtor number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Product group</TableHead>
            <TableHead className="text-right">Year</TableHead>
            <TableHead className="text-right">Month</TableHead>
            <TableHead className="text-right">Weight (kg)</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">Profit margin</TableHead>
            <TableHead className="text-right">#Invoice lines</TableHead>
            <TableHead>Region</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={14}
                className="h-24 text-center text-muted-foreground"
              >
                No customer revenue found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  {salesRepresentativeLabel(row.representative)}
                </TableCell>
                <TableCell>{customerGroupLabel(row.customerGroup)}</TableCell>
                <TableCell className="text-right">
                  {row.customerCode ?? "—"}
                </TableCell>
                <TableCell className="font-medium">
                  {row.customerName ?? "—"}
                </TableCell>
                <TableCell>{row.city ?? "—"}</TableCell>
                <TableCell>{row.productGroupName ?? "—"}</TableCell>
                <TableCell className="text-right">{row.year ?? "—"}</TableCell>
                <TableCell className="text-right">{row.month ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.weightKg)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.revenue)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.profit)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.profitMargin)}%
                </TableCell>
                <TableCell className="text-right">{row.invoiceLines}</TableCell>
                <TableCell>{row.region ?? "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
