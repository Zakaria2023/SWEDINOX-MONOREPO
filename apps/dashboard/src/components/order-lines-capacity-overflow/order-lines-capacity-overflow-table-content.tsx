"use client";

import Link from "next/link";
import { CapacityOverflowRow } from "@/app/(dashboard)/order-lines-capacity-overflow/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  formatDateColumn,
  formatNumber,
  orDash,
  yesNo,
} from "@/lib/helpers";
import { ORDER_ITEM_STATUS_LABELS } from "@/lib/labels";

type Props = {
  rows: CapacityOverflowRow[];
};

// Column order follows the reference grid: the action trail first, then the
// order line, then the sawing plan — reading left to right answers "what was
// decided", "on what", "and how is it being made".
const HEADERS = [
  "Action",
  "Order",
  "Order type",
  "Action by",
  "Company",
  "Capacity date",
  "Capacity name",
  "Accountability",
  "Line",
  "Action on",
  "Product code",
  "Product",
  "Length (mm)",
  "Width (mm)",
  "Thickness",
  "Quality",
  "Category",
  "Pick-up",
  "Sawing spec",
  "Fixed dim.",
  "To saw",
  "Production start",
  "Planned delivery",
  "Delivered",
  "U (delivery)",
  "Delivery date (p)",
  "Delivery date (a)",
  "Delivery status",
  "Kg(p)",
  "Kg(a)",
  "Order line delivery date",
  "Line Qty(p)",
  "Line Qty(a)",
  "Line QtyU",
  "Option Qty",
  "Line status",
  "Line type",
  "Sawing workorder",
  "Sawing wo. line",
  "Sawing machine",
  "Drilling holes",
  "L.Saw angle",
  "R.Saw angle",
  "Bls",
  "Standing",
  "Sawing type",
  "Sawing angle(s)",
  "Transport date",
];

export const OrderLinesCapacityOverflowTable = ({ rows }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          {HEADERS.map((header) => (
            <TableHead key={header} className="whitespace-nowrap">
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={HEADERS.length}
              className="h-24 text-center text-muted-foreground"
            >
              No capacity overflows recorded.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="font-medium">
                <Link
                  href={`/order-lines-capacity-overflow/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {row.action ?? `Overflow #${row.id}`}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {row.orderUuid ? (
                  <Link
                    href={`/orders/${row.orderUuid}`}
                    className="text-primary hover:underline"
                  >
                    {orDash(row.orderId)}
                  </Link>
                ) : (
                  orDash(row.orderId)
                )}
              </TableCell>
              <TableCell>{row.orderType}</TableCell>
              <TableCell>{orDash(row.actionByUserId)}</TableCell>
              <TableCell>{orDash(row.companyName)}</TableCell>
              <TableCell>{formatDateColumn(row.capacityDate)}</TableCell>
              <TableCell>{orDash(row.capacityName)}</TableCell>
              <TableCell>{orDash(row.accountability)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(row.lineNumber)}
              </TableCell>
              <TableCell>{formatDateColumn(row.actionOn)}</TableCell>
              <TableCell>{orDash(row.productCode)}</TableCell>
              <TableCell>{orDash(row.productName)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(row.lengthMm)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(row.widthMm)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(row.thicknessMm)}
              </TableCell>
              <TableCell>{orDash(row.quality)}</TableCell>
              <TableCell>{orDash(row.category)}</TableCell>
              <TableCell>{yesNo(row.isPickup)}</TableCell>
              <TableCell>{yesNo(row.sawingSpec)}</TableCell>
              <TableCell>{yesNo(row.fixedDimension)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(row.toSaw)}
              </TableCell>
              <TableCell>
                {formatDateColumn(row.productionStartingDate)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(row.plannedDeliveredQty)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(row.deliveredQty)}
              </TableCell>
              <TableCell>{orDash(row.deliveryUnit)}</TableCell>
              <TableCell>{formatDateColumn(row.deliveryDatePlanned)}</TableCell>
              <TableCell>{formatDateColumn(row.deliveryDateActual)}</TableCell>
              <TableCell>{orDash(row.deliveryStatus)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(row.kgPlanned ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(row.kgActual ?? 0))}
              </TableCell>
              <TableCell>
                {formatDateColumn(row.orderLineDeliveryDate)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(row.qtyPlanned ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(row.qtyActual ?? 0))}
              </TableCell>
              <TableCell>{row.unit?.toUpperCase() ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(row.optionQty)}
              </TableCell>
              <TableCell>
                {row.lineStatus
                  ? ORDER_ITEM_STATUS_LABELS[row.lineStatus]
                  : "—"}
              </TableCell>
              <TableCell>{orDash(row.lineType)}</TableCell>
              <TableCell>{orDash(row.sawingWorkOrder)}</TableCell>
              <TableCell>{orDash(row.sawingWorkOrderLine)}</TableCell>
              <TableCell>{orDash(row.sawingMachine)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(row.drillingHoles)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(row.leftSawAngle)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(row.rightSawAngle)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {orDash(row.bundles)}
              </TableCell>
              <TableCell>{yesNo(row.standing)}</TableCell>
              <TableCell>{orDash(row.sawingType)}</TableCell>
              <TableCell>{orDash(row.sawingAngles)}</TableCell>
              <TableCell>{formatDateColumn(row.transportDate)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
