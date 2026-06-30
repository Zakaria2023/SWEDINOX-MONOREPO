"use client";

import Link from "next/link";
import { QuoteListItem } from "@/app/(dashboard)/quotes/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ORDER_METHOD_LABELS } from "@/lib/labels";
import { OrderMethod } from "@/lib/enums";

type Props = {
  quotes: QuoteListItem[];
};

export const QuotesTable = ({ quotes }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Request</TableHead>
          <TableHead>Valid Until</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-24 text-center text-muted-foreground"
            >
              No quotes found.
            </TableCell>
          </TableRow>
        ) : (
          quotes.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                <Link
                  href={`/quotes/${row.uuid}`}
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
                {row.requestMethod
                  ? (ORDER_METHOD_LABELS[row.requestMethod as OrderMethod] ??
                    row.requestMethod)
                  : "—"}
              </TableCell>
              <TableCell>
                {row.validUntil
                  ? new Date(row.validUntil).toLocaleDateString("en-GB")
                  : "—"}
              </TableCell>
              <TableCell>
                {new Date(row.createdAt).toLocaleDateString("en-GB")}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
