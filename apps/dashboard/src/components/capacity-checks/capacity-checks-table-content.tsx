"use client";

import { CapacityCheckListItem } from "@/app/(dashboard)/capacity-checks/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { PRODUCTION_CAPACITY_STATUS_LABELS } from "@/lib/labels";
import { formatDateValue } from "@/lib/helpers";
import { ProductionCapacityStatus } from "@/lib/enums";

type Props = {
  checks: CapacityCheckListItem[];
};

const STATUS_STYLES: Record<ProductionCapacityStatus, string> = {
  ok: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  full: "bg-red-100 text-red-700",
};

export const CapacityChecksTable = ({ checks }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Check</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Occupied capacity</TableHead>
          <TableHead className="text-right">Capacity</TableHead>
          <TableHead className="text-right">Maximum Capacity</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time alert email</TableHead>
          <TableHead>Time max warning</TableHead>
          <TableHead className="text-right">Warning capacity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {checks.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={10}
              className="h-24 text-center text-muted-foreground"
            >
              No capacity checks found.
            </TableCell>
          </TableRow>
        ) : (
          checks.map((row) => (
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
                {row.checkName ?? "—"}
              </TableCell>
              <TableCell>{row.type ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.occupiedCapacity ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.capacity ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.maximumCapacity ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.checkDate)}
              </TableCell>
              <TableCell>{row.timeAlertEmail ?? "—"}</TableCell>
              <TableCell>{row.timeMaxWarning ?? "—"}</TableCell>
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
