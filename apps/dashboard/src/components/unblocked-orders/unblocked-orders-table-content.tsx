"use client";

import { UnblockedOrderRow } from "@/app/(dashboard)/unblocked-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { OrderDeblockType } from "@/lib/enums";
import { ORDER_DEBLOCK_TYPE_LABELS } from "@/lib/labels";

type Props = {
  rows: UnblockedOrderRow[];
};

const money = (value: number) =>
  `€ ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const deblockTypeLabel = (value: OrderDeblockType) =>
  ORDER_DEBLOCK_TYPE_LABELS[value] ?? value;

const datePart = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB") : "—";

const timePart = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const UnblockedOrdersTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer name</TableHead>
          <TableHead>City</TableHead>
          <TableHead className="text-right">Debtor number</TableHead>
          <TableHead>Deblock type</TableHead>
          <TableHead className="text-right">Year</TableHead>
          <TableHead className="text-right">Month</TableHead>
          <TableHead>Deblock date</TableHead>
          <TableHead>Deblock time</TableHead>
          <TableHead>Deblocked by</TableHead>
          <TableHead>Order</TableHead>
          <TableHead>Creation date of Order</TableHead>
          <TableHead className="text-right">Order amount</TableHead>
          <TableHead>Region code</TableHead>
          <TableHead>Region</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={14}
              className="h-24 text-center text-muted-foreground"
            >
              No unblocked orders found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                {row.customerName ?? "—"}
              </TableCell>
              <TableCell>{row.city ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.debtorNumber ?? "—"}
              </TableCell>
              <TableCell>{deblockTypeLabel(row.deblockType)}</TableCell>
              <TableCell className="text-right">{row.year ?? "—"}</TableCell>
              <TableCell className="text-right">{row.month ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {datePart(row.deblockDate)}
              </TableCell>
              <TableCell>{timePart(row.deblockDate)}</TableCell>
              <TableCell>{row.deblockedBy ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {row.orderCode ?? (row.orderId ? `#${row.orderId}` : "—")}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {datePart(row.orderCreatedAt)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.orderAmount)}
              </TableCell>
              <TableCell>{row.regionCode ?? "—"}</TableCell>
              <TableCell>{row.region ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
