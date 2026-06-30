"use client";

import Link from "next/link";
import { PurchaseQuoteListItem } from "@/app/(dashboard)/purchase-quotes/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { PURCHASE_ORDER_TYPE_LABELS } from "@/lib/labels";
import { PurchaseOrderType } from "@/lib/enums";

type Props = {
  purchaseQuotes: PurchaseQuoteListItem[];
};

export const PurchaseQuotesTable = ({ purchaseQuotes }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Quote No</TableHead>
          <TableHead>Supplier / Agent</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Valid Until</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchaseQuotes.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="h-24 text-center text-muted-foreground"
            >
              No purchase quotes found.
            </TableCell>
          </TableRow>
        ) : (
          purchaseQuotes.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                <Link
                  href={`/purchase-quotes/${row.uuid}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {row.id}
                </Link>
              </TableCell>
              <TableCell>{row.quoteNumber ?? "—"}</TableCell>
              <TableCell>
                {row.supplierName ?? row.agentName ?? "—"}
              </TableCell>
              <TableCell>
                {[row.contactFirstName, row.contactLastName]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </TableCell>
              <TableCell>
                {row.purchaseOrderType
                  ? (PURCHASE_ORDER_TYPE_LABELS[
                      row.purchaseOrderType as PurchaseOrderType
                    ] ?? row.purchaseOrderType)
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
