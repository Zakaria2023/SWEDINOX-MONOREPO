"use client";

import { WarehouseCapacityListItem } from "@/app/(dashboard)/warehouse-capacity/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { WAREHOUSE_WORK_ORDER_LINE_TYPE_LABELS } from "@/lib/labels";
import { formatDateValue } from "@/lib/helpers";

type Props = {
  capacity: WarehouseCapacityListItem[];
};

export const WarehouseCapacityTable = ({ capacity }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Warehouse section</TableHead>
          <TableHead>Subsection</TableHead>
          <TableHead>Workorder type</TableHead>
          <TableHead className="text-right">Occupied</TableHead>
          <TableHead className="text-right">Ready</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {capacity.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="h-24 text-center text-muted-foreground"
            >
              No warehouse capacity found.
            </TableCell>
          </TableRow>
        ) : (
          capacity.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.capacityDate)}
              </TableCell>
              <TableCell>{row.warehouseSection ?? "—"}</TableCell>
              <TableCell>{row.subsection ?? "—"}</TableCell>
              <TableCell>
                {row.workOrderType
                  ? WAREHOUSE_WORK_ORDER_LINE_TYPE_LABELS[row.workOrderType]
                  : "—"}
              </TableCell>
              <TableCell className="text-right">{row.occupied}</TableCell>
              <TableCell className="text-right">{row.ready}</TableCell>
              <TableCell className="text-right">{row.remaining}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
