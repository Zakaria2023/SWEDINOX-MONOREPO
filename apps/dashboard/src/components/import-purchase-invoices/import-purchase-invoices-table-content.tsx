"use client";

import { ImportPurchaseInvoiceRow } from "@/app/(dashboard)/import-purchase-invoices/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateValue } from "@/lib/helpers";

type Props = {
  rows: ImportPurchaseInvoiceRow[];
};

const Dash = () => <span className="text-muted-foreground">—</span>;

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
          <TableHead>Receive data</TableHead>
          <TableHead>Data sent storage</TableHead>
          <TableHead>Data sent</TableHead>
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
              colSpan={19}
              className="h-24 text-center text-muted-foreground"
            >
              No purchase-invoice import messages.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.createdOn)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.adjustedOn)}
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>{row.specification ?? "—"}</TableCell>
              <TableCell>{row.invoiceStatus ?? "—"}</TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>{row.invoiceNo ?? "—"}</TableCell>
              <TableCell>{row.supplierName ?? "—"}</TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell>
                <Dash />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
