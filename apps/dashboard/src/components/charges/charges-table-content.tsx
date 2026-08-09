"use client";

import Link from "next/link";
import { ChargeListItem } from "@/app/(dashboard)/charges/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  charges: ChargeListItem[];
};

export const ChargesTable = ({ charges }: Props) => (
  <div className="space-y-4">
    <div className="flex justify-end">
      <TableExportButton
        tableId="charges-table"
        fileName="charges"
        sheetName="Charges"
      />
    </div>

    <Table id="charges-table">
      <TableHeader>
        <TableRow>
          <TableHead>Order type</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Creation date</TableHead>
          <TableHead>Delivery date</TableHead>
          <TableHead>Revenue group</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Surcharge</TableHead>
          <TableHead>Contract</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Cost</TableHead>
          <TableHead className="text-right">Profit</TableHead>
          <TableHead className="text-right">Weight</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {charges.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={14}
              className="h-24 text-center text-muted-foreground"
            >
              No charges found.
            </TableCell>
          </TableRow>
        ) : (
          charges.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>{row.orderType ?? "—"}</TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/charges/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {row.code ?? `Charge #${row.id}`}
                </Link>
              </TableCell>
              <TableCell>{row.creationDate ?? "—"}</TableCell>
              <TableCell>{row.deliveryDate ?? "—"}</TableCell>
              <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
              <TableCell>{row.customerName ?? "—"}</TableCell>
              <TableCell>{row.surcharge ?? "—"}</TableCell>
              <TableCell>{row.contract ?? "—"}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                € {row.amount}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                € {row.cost}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                € {row.profit}
              </TableCell>
              <TableCell className="text-right">{row.weightKg}</TableCell>
              <TableCell>{row.country ?? "—"}</TableCell>
              <TableCell>{row.status ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
