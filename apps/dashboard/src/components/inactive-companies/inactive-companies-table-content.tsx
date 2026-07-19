"use client";

import Link from "next/link";
import { InactiveCompanyRow } from "@/app/(dashboard)/inactive-companies/actions";
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
  rows: InactiveCompanyRow[];
};

const fmtDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "Never";

const representativeLabel = (value: SalesRepresentative | null) =>
  value ? (SALES_REPRESENTATIVE_LABELS[value] ?? value) : "—";

const customerGroupLabel = (value: CustomerGroup | null) =>
  value ? (CUSTOMER_GROUP_LABELS[value] ?? value) : "—";

export const InactiveCompaniesTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Company code</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Representative</TableHead>
          <TableHead>Customer group</TableHead>
          <TableHead>Region</TableHead>
          <TableHead>Last order date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="h-24 text-center text-muted-foreground"
            >
              No inactive companies found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.companyUuid}>
              <TableCell className="text-right">{row.companyCode}</TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/companies/${row.companyUuid}`}
                  className="underline-offset-4 hover:underline"
                >
                  {row.companyName}
                </Link>
              </TableCell>
              <TableCell>{row.city ?? "—"}</TableCell>
              <TableCell>{representativeLabel(row.representative)}</TableCell>
              <TableCell>{customerGroupLabel(row.customerGroup)}</TableCell>
              <TableCell>{row.region ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {fmtDate(row.lastOrderDate)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
