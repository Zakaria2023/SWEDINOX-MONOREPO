"use client";

import Link from "next/link";
import { ComplaintListItem } from "@/app/(dashboard)/complaints/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { COMPLAINT_CATEGORY_LABELS, COMPLAINT_TYPE_LABELS } from "@/lib/labels";
import { ComplaintCategory, ComplaintType } from "@/lib/enums";

type Props = {
  complaints: ComplaintListItem[];
};

export const ComplaintsTableContent = ({ complaints }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Report Date</TableHead>
          <TableHead>Product</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {complaints.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="h-24 text-center text-muted-foreground"
            >
              No complaints found.
            </TableCell>
          </TableRow>
        ) : (
          complaints.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                <Link
                  href={`/complaints/${row.uuid}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {row.id}
                </Link>
              </TableCell>
              <TableCell>{row.companyName ?? "—"}</TableCell>
              <TableCell>
                {[row.contactFirstName, row.contactLastName]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </TableCell>
              <TableCell>
                {row.complaintType
                  ? (COMPLAINT_TYPE_LABELS[
                      row.complaintType as ComplaintType
                    ] ?? row.complaintType)
                  : "—"}
              </TableCell>
              <TableCell>
                {row.category
                  ? (COMPLAINT_CATEGORY_LABELS[
                      row.category as ComplaintCategory
                    ] ?? row.category)
                  : "—"}
              </TableCell>
              <TableCell>
                {row.reportDate
                  ? new Date(row.reportDate).toLocaleDateString("en-GB")
                  : "—"}
              </TableCell>
              <TableCell>{row.productCode ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
