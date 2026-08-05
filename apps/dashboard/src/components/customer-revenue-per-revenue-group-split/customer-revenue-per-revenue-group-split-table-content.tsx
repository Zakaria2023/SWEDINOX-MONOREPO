"use client";

import { CustomerRevenueSplitRow } from "@/app/(dashboard)/customer-revenue-per-revenue-group-split/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { customerGroupLabel, formatMoney, formatNumber, salesRepresentativeLabel } from "@/lib/helpers";

type Props = {
  rows: CustomerRevenueSplitRow[];
};

export const CustomerRevenuePerRevenueGroupSplitTable = ({ rows }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Representative</TableHead>
          <TableHead>Customer group</TableHead>
          <TableHead className="text-right">Debtor number</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>City</TableHead>
          <TableHead className="text-right">Revenue group</TableHead>
          <TableHead>Revenue group name</TableHead>
          <TableHead>Order type</TableHead>
          <TableHead className="text-right">Year</TableHead>
          <TableHead className="text-right">Month</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Profit</TableHead>
          <TableHead className="text-right">Profit margin</TableHead>
          <TableHead className="text-right">Weight (kg)</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Account manager</TableHead>
          <TableHead>Region</TableHead>
          <TableHead className="text-right">#Invoice lines</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={18}
              className="h-24 text-center text-muted-foreground"
            >
              No customer revenue found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{salesRepresentativeLabel(row.representative)}</TableCell>
              <TableCell>{customerGroupLabel(row.customerGroup)}</TableCell>
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
              <TableCell>{row.orderType}</TableCell>
              <TableCell className="text-right">{row.year ?? "—"}</TableCell>
              <TableCell className="text-right">{row.month ?? "—"}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.revenue)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.profit)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.profitMargin)}%
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.weightKg)}
              </TableCell>
              <TableCell>{row.country ?? "—"}</TableCell>
              <TableCell>{row.accountManager ?? "—"}</TableCell>
              <TableCell>{row.region ?? "—"}</TableCell>
              <TableCell className="text-right">{row.invoiceLines}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
