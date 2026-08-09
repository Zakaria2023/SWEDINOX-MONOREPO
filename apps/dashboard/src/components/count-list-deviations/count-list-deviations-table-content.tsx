"use client";

import Link from "next/link";
import { CountListDeviationListItem } from "@/app/(dashboard)/count-list-deviations/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { STOCK_UNIT_LABELS } from "@/lib/labels";
import { formatDateValue } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  deviations: CountListDeviationListItem[];
};

export const CountListDeviationsTable = ({ deviations }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="count-list-deviations-table"
          fileName="count-list-deviations"
          sheetName="Deviations in Count Lists"
        />
      </div>
      <Table id="count-list-deviations-table">
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Workorder #</TableHead>
            <TableHead>Workorder date</TableHead>
            <TableHead>Booked by</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Length (mm)</TableHead>
            <TableHead className="text-right">Qty.</TableHead>
            <TableHead>U.</TableHead>
            <TableHead className="text-right">Kg.</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Document</TableHead>
            <TableHead className="text-right">Old stk.</TableHead>
            <TableHead className="text-right">Old stk. Kg.</TableHead>
            <TableHead className="text-right">New stk.</TableHead>
            <TableHead className="text-right">New stk. Kg.</TableHead>
            <TableHead>Date reported as completed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deviations.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={17}
                className="h-24 text-center text-muted-foreground"
              >
                No count-list deviations found.
              </TableCell>
            </TableRow>
          ) : (
            deviations.map((row) => (
              <TableRow key={row.uuid}>
                <TableCell className="font-medium">
                  <Link
                    href={`/count-list-deviations/${row.uuid}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {row.id}
                  </Link>
                </TableCell>
                <TableCell>{row.workOrderNumber ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.workOrderDate)}
                </TableCell>
                <TableCell>{row.bookedBy ?? "—"}</TableCell>
                <TableCell>{row.location ?? "—"}</TableCell>
                <TableCell className="font-medium">
                  {[row.productCode, row.productName]
                    .filter(Boolean)
                    .join(" — ") || "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.length ?? "—"}
                </TableCell>
                <TableCell className="text-right">{row.quantity}</TableCell>
                <TableCell>
                  {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                </TableCell>
                <TableCell className="text-right">{row.kg ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.amount ?? "—"}
                </TableCell>
                <TableCell>{row.documentReference ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.oldStockQty ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.oldStockKg ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.newStockQty ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.newStockKg ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.dateReportedAsCompleted)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
