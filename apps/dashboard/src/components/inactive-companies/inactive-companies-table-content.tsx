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
import {
  customerGroupLabel,
  formatDateValue,
  salesRepresentativeLabel,
} from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: InactiveCompanyRow[];
};

export const InactiveCompaniesTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="inactive-companies-table"
          fileName="inactive-companies"
          sheetName="Inactive companies"
        />
      </div>
      <Table id="inactive-companies-table">
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
                <TableCell>
                  {salesRepresentativeLabel(row.representative)}
                </TableCell>
                <TableCell>{customerGroupLabel(row.customerGroup)}</TableCell>
                <TableCell>{row.region ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.lastOrderDate, "Never")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
