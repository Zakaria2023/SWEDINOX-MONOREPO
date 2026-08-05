"use client";

import Link from "next/link";
import { TripDataListItem } from "@/app/(dashboard)/trip-data/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

type Props = {
  trips: TripDataListItem[];
};

export const TripDataTable = ({ trips }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Trip</TableHead>
          <TableHead>Trip date</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead className="text-right">Stops</TableHead>
          <TableHead className="text-right">Kg.</TableHead>
          <TableHead className="text-right">Colli</TableHead>
          <TableHead>Orders per stop</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trips.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="h-24 text-center text-muted-foreground"
            >
              No trips found.
            </TableCell>
          </TableRow>
        ) : (
          trips.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="text-right font-medium">
                <Link
                  href={`/trip-data/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {row.tripNumber ?? `#${row.id}`}
                </Link>
              </TableCell>
              <TableCell>{row.tripDate ?? "—"}</TableCell>
              <TableCell>{row.vehicle ?? "—"}</TableCell>
              <TableCell className="text-right">{row.stops}</TableCell>
              <TableCell className="text-right">{row.kg}</TableCell>
              <TableCell className="text-right">{row.colli}</TableCell>
              <TableCell>{row.ordersPerStop ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
