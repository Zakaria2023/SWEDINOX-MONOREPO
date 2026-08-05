"use client";

import Link from "next/link";
import { ProductionCapacityListItem } from "@/app/(dashboard)/production-capacity/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  MACHINE_PRODUCTION_LABELS,
  PRODUCTION_CAPACITY_STATUS_LABELS,
} from "@/lib/labels";
import { formatDateValue } from "@/lib/helpers";
import { ProductionCapacityStatus } from "@/lib/enums";

type Props = {
  capacity: ProductionCapacityListItem[];
};

const STATUS_STYLES: Record<ProductionCapacityStatus, string> = {
  ok: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  full: "bg-red-100 text-red-700",
};

export const ProductionCapacityTable = ({ capacity }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Machine</TableHead>
          <TableHead>Type of machine</TableHead>
          <TableHead className="text-right">Maximum Capacity</TableHead>
          <TableHead className="text-right">Capacity</TableHead>
          <TableHead className="text-right">Remaining (not square)</TableHead>
          <TableHead className="text-right">Occupied (not square)</TableHead>
          <TableHead className="text-right">Ready</TableHead>
          <TableHead className="text-right">Ready (not square)</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
          <TableHead className="text-right">Occupied capacity</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Warning capacity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {capacity.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={13}
              className="h-24 text-center text-muted-foreground"
            >
              No production capacity found.
            </TableCell>
          </TableRow>
        ) : (
          capacity.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                {row.status ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}
                  >
                    {PRODUCTION_CAPACITY_STATUS_LABELS[row.status]}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/production-capacity/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {[row.machineCode, row.machineName]
                    .filter(Boolean)
                    .join(" — ") || `Row #${row.id}`}
                </Link>
              </TableCell>
              <TableCell>
                {row.machineType
                  ? MACHINE_PRODUCTION_LABELS[row.machineType]
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.maximumCapacity ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.capacity ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.remainingNotSquare ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.occupiedNotSquare ?? "—"}
              </TableCell>
              <TableCell className="text-right">{row.ready ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.readyNotSquare ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.remaining ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.occupiedCapacity ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.capacityDate)}
              </TableCell>
              <TableCell className="text-right">
                {row.warningCapacity ?? "—"}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
