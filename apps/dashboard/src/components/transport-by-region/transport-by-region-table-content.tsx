"use client";

import { TransportByRegionRow } from "@/app/(dashboard)/transport-by-region/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateValue, formatNumber } from "@/lib/helpers";

type Props = {
  rows: TransportByRegionRow[];
};

const Dash = () => <span className="text-muted-foreground">—</span>;

export const TransportByRegionTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Transport date</TableHead>
          <TableHead>Delivery address code</TableHead>
          <TableHead>Region</TableHead>
          <TableHead>Delivery address name</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Delivery address city</TableHead>
          <TableHead className="text-right">Kg (p) total</TableHead>
          <TableHead className="text-right">Kg (a) total</TableHead>
          <TableHead className="text-right">Length (largest)</TableHead>
          <TableHead>Trip status</TableHead>
          <TableHead>Source status (lowest)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={11}
              className="h-24 text-center text-muted-foreground"
            >
              No transport trips found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.transportDate)}
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
              <TableCell>{row.vehicle ?? "—"}</TableCell>
              <TableCell>
                <Dash />
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(Number(row.kgPlannedTotal ?? 0))}
              </TableCell>
              <TableCell className="text-right">
                <Dash />
              </TableCell>
              <TableCell className="text-right">
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
