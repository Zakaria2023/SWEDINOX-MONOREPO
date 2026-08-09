"use client";

import Link from "next/link";
import { ReservationRecord } from "@/app/(dashboard)/reservations/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  STOCK_UNIT_LABELS,
  WAREHOUSE_LOCATION_TYPE_LABELS,
} from "@/lib/labels";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  records: ReservationRecord[];
};

export const ReservationRecordsTable = ({ records }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="reservations-table"
          fileName="reservations"
          sheetName="Reservations"
        />
      </div>
      <Table id="reservations-table">
        <TableHeader>
          <TableRow>
            <TableHead>Product code</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-center">Stock product</TableHead>
            <TableHead className="text-center">Standard product</TableHead>
            <TableHead className="text-right">Length</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Location type</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead>U.</TableHead>
            <TableHead className="text-right">Order</TableHead>
            <TableHead className="text-right">Order line</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Reservation type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={14}
                className="h-24 text-center text-muted-foreground"
              >
                No reservations found.
              </TableCell>
            </TableRow>
          ) : (
            records.map((row) => (
              <TableRow key={row.uuid}>
                <TableCell className="font-medium">
                  <Link
                    href={`/order-lines/${row.uuid}`}
                    className="text-primary hover:underline"
                  >
                    {row.productCode ?? "View line"}
                  </Link>
                </TableCell>
                <TableCell>{row.productName ?? "—"}</TableCell>
                <TableCell className="text-center">
                  {row.stockProduct ? "Yes" : ""}
                </TableCell>
                <TableCell className="text-center">
                  {row.standardProduct ? "Yes" : ""}
                </TableCell>
                <TableCell className="text-right">
                  {row.productLength ?? "—"}
                </TableCell>
                <TableCell>{row.sectionName ?? "—"}</TableCell>
                <TableCell>{row.locationName ?? "—"}</TableCell>
                <TableCell>
                  {row.locationType
                    ? WAREHOUSE_LOCATION_TYPE_LABELS[row.locationType]
                    : "—"}
                </TableCell>
                <TableCell className="text-right">{row.quantity}</TableCell>
                <TableCell>
                  {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.orderId ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.lineNumber ?? "—"}
                </TableCell>
                <TableCell>{row.companyName ?? "—"}</TableCell>
                <TableCell>{row.reservationType}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
