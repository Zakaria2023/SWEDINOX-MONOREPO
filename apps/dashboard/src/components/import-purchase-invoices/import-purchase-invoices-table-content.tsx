"use client";

import { AlertTriangle } from "lucide-react";
import { ImportedPurchaseInvoiceRow } from "@/app/(dashboard)/import-purchase-invoices/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateColumn, orDash, yesNo } from "@/lib/helpers";

type Props = {
  rows: ImportedPurchaseInvoiceRow[];
};

// The raw payloads are deliberately not printed: they are megabytes of EDI and
// would make the grid unreadable. What is shown is where they were parked, so
// the message can be pulled from storage when one needs reading.
export const ImportPurchaseInvoicesTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Created on</TableHead>
          <TableHead>Adjusted on</TableHead>
          <TableHead>Adjusted by</TableHead>
          <TableHead>Final destination</TableHead>
          <TableHead>Specification</TableHead>
          <TableHead>Invoice status</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Invoice no.</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Work panel</TableHead>
          <TableHead>Receive data storage</TableHead>
          <TableHead>Data sent storage</TableHead>
          <TableHead>Invoked method</TableHead>
          <TableHead>Retry possible</TableHead>
          <TableHead>Last error message</TableHead>
          <TableHead>Error message</TableHead>
          <TableHead>User interaction required</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={17}
              className="h-24 text-center text-muted-foreground"
            >
              No imported purchase invoices.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="whitespace-nowrap">
                {formatDateColumn(row.createdAt)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateColumn(row.adjustedAt)}
              </TableCell>
              <TableCell>{orDash(row.adjustedByUserId)}</TableCell>
              <TableCell>{orDash(row.finalDestination)}</TableCell>
              <TableCell>{orDash(row.specification)}</TableCell>
              <TableCell>{orDash(row.invoiceStatus)}</TableCell>
              <TableCell>{orDash(row.role)}</TableCell>
              <TableCell className="font-medium">
                {orDash(row.invoiceNumber)}
              </TableCell>
              <TableCell>{orDash(row.supplierName)}</TableCell>
              <TableCell>{orDash(row.workPanel)}</TableCell>
              <TableCell>{orDash(row.receiveDataStorage)}</TableCell>
              <TableCell>{orDash(row.dataSentStorage)}</TableCell>
              <TableCell>{orDash(row.invokedMethod)}</TableCell>
              <TableCell>{yesNo(row.retryPossible)}</TableCell>
              <TableCell className="max-w-xs">
                <span className="line-clamp-2 text-destructive">
                  {orDash(row.lastErrorMessage)}
                </span>
              </TableCell>
              <TableCell className="max-w-xs">
                <span className="line-clamp-2 text-destructive">
                  {orDash(row.errorMessage)}
                </span>
              </TableCell>
              <TableCell>
                {row.userInteractionRequired ? (
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <AlertTriangle className="size-3.5" />
                    Yes
                  </span>
                ) : (
                  "No"
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
