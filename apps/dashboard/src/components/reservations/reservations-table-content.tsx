"use client";

import { ReservationItem } from "@/app/(dashboard)/reservations/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

type Props = {
  reservations: ReservationItem[];
};

const format = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const ReservationsTable = ({ reservations }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product code</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Qty Techn. Stock</TableHead>
          <TableHead className="text-right">Kg Techn. Stock</TableHead>
          <TableHead className="text-right">Qty Reserved</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservations.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="h-24 text-center text-muted-foreground"
            >
              No reservations found.
            </TableCell>
          </TableRow>
        ) : (
          reservations.map((row) => (
            <TableRow key={row.productUuid}>
              <TableCell className="font-medium">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell className="text-right">
                {format(row.technicalQty)}
              </TableCell>
              <TableCell className="text-right">
                {format(row.technicalKg)}
              </TableCell>
              <TableCell className="text-right">
                {format(row.reservedQty)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
