"use client";

import { CustomerRevenueSalesVisitsRow } from "@/app/(dashboard)/customer-revenue-sales-and-visits/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { SalesRepresentative } from "@/lib/enums";
import { SALES_REPRESENTATIVE_LABELS } from "@/lib/labels";

type Props = {
  rows: CustomerRevenueSalesVisitsRow[];
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

export const CustomerRevenueSalesVisitsTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Representative</TableHead>
          <TableHead className="text-right">Company code</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Visit-Postal</TableHead>
          <TableHead>Visit-City</TableHead>
          <TableHead className="text-right">Revenue group</TableHead>
          <TableHead>Revenue group name</TableHead>
          <TableHead className="text-right">Current year</TableHead>
          <TableHead className="text-right">Revenue current year</TableHead>
          <TableHead className="text-right">Revenue last year</TableHead>
          <TableHead className="text-right">Revenue 2 years ago</TableHead>
          <TableHead className="text-right">Kg current year</TableHead>
          <TableHead className="text-right">Kg last year</TableHead>
          <TableHead className="text-right">Kg 2 years ago</TableHead>
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
              <TableCell className="text-right">
                {row.companyCode ?? "—"}
              </TableCell>
              <TableCell className="font-medium">
                {row.companyName ?? "—"}
              </TableCell>
              <TableCell>{row.visitPostalCode ?? "—"}</TableCell>
              <TableCell>{row.visitCity ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.revenueGroupNumber ?? "—"}
              </TableCell>
              <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
              <TableCell className="text-right">{row.currentYear}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.revenueCurrentYear)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.revenueLastYear)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.revenueTwoYearsAgo)}
              </TableCell>
              <TableCell className="text-right">
                {number(row.kgCurrentYear)}
              </TableCell>
              <TableCell className="text-right">
                {number(row.kgLastYear)}
              </TableCell>
              <TableCell className="text-right">
                {number(row.kgTwoYearsAgo)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
