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
import { CustomerGroup, SalesRepresentative } from "@/lib/enums";
import { CUSTOMER_GROUP_LABELS, SALES_REPRESENTATIVE_LABELS } from "@/lib/labels";

type Props = {
  rows: CustomerRevenuePerProductGroupRow[];
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

const representativeLabel = (value: SalesRepresentative | null) =>
  value ? (SALES_REPRESENTATIVE_LABELS[value] ?? value) : "—";

const customerGroupLabel = (value: CustomerGroup | null) =>
  value ? (CUSTOMER_GROUP_LABELS[value] ?? value) : "—";

export const CustomerRevenuePerProductGroupTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
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
              <TableCell>{representativeLabel(row.representative)}</TableCell>
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
                {number(row.weightKg)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.revenue)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.profit)}
              </TableCell>
              <TableCell className="text-right">
                {number(row.profitMargin)}%
              </TableCell>
              <TableCell className="text-right">{row.invoiceLines}</TableCell>
              <TableCell>{row.region ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
