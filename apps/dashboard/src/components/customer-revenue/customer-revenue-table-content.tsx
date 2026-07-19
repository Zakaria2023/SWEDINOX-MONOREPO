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

type Props = {
  rows: CustomerRevenueRow[];
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

export const CustomerRevenueTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead className="text-right">Debtor number</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Country</TableHead>
          <TableHead className="text-right">Month</TableHead>
          <TableHead className="text-right">Year</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Weight (kg)</TableHead>
          <TableHead className="text-right">Profit</TableHead>
          <TableHead className="text-right">Profit margin</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={10}
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
              <TableCell className="text-right">{row.month ?? "—"}</TableCell>
              <TableCell className="text-right">{row.year ?? "—"}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.revenue)}
              </TableCell>
              <TableCell className="text-right">
                {number(row.weightKg)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.profit)}
              </TableCell>
              <TableCell className="text-right">
                {number(row.profitMargin)}%
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
