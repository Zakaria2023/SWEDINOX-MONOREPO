"use client";

import { VisitMadeRow } from "@/app/(dashboard)/visits-made/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { fullName, orDash, yesNo } from "@/lib/helpers";
import {
  CUSTOMER_GROUP_LABELS,
  VISIT_REPORT_CONTACT_METHOD_LABELS,
  VISIT_REPORT_REASON_LABELS,
} from "@/lib/labels";

type Props = {
  rows: VisitMadeRow[];
};

export const VisitsMadeTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Representative</TableHead>
          <TableHead>Customer code</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Postal code</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Visiting date</TableHead>
          <TableHead>Visited by</TableHead>
          <TableHead>Contact person</TableHead>
          <TableHead>Categories</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Took place</TableHead>
          <TableHead>Visit reason</TableHead>
          <TableHead>Region</TableHead>
          <TableHead>Customer group</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={14}
              className="h-24 text-center text-muted-foreground"
            >
              No visits recorded.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="font-medium">
                {orDash(row.representative)}
              </TableCell>
              <TableCell>{orDash(row.customerCode)}</TableCell>
              <TableCell>{orDash(row.companyName)}</TableCell>
              <TableCell>{orDash(row.postalCode)}</TableCell>
              <TableCell>{orDash(row.city)}</TableCell>
              <TableCell>{orDash(row.visitDate)}</TableCell>
              <TableCell>{orDash(row.visitedBy)}</TableCell>
              <TableCell>
                {fullName(row.contactFirstName, row.contactLastName) || "—"}
              </TableCell>
              <TableCell>
                {row.categories?.length
                  ? row.categories.join(", ")
                  : "—"}
              </TableCell>
              <TableCell>
                {row.contactMethod
                  ? VISIT_REPORT_CONTACT_METHOD_LABELS[row.contactMethod]
                  : "—"}
              </TableCell>
              <TableCell>{yesNo(row.hasTakenPlace)}</TableCell>
              <TableCell>
                {row.visitReason
                  ? VISIT_REPORT_REASON_LABELS[row.visitReason]
                  : "—"}
              </TableCell>
              <TableCell>{orDash(row.region)}</TableCell>
              <TableCell>
                {row.customerGroup
                  ? CUSTOMER_GROUP_LABELS[row.customerGroup]
                  : "—"}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
