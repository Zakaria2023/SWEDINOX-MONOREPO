"use client";

import { Check, Minus } from "lucide-react";
import Link from "next/link";
import { PickStatisticListItem } from "@/app/(dashboard)/pick-statistics/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { STOCK_UNIT_LABELS } from "@/lib/labels";

type Props = {
  statistics: PickStatisticListItem[];
};

type BooleanCellProps = {
  value: boolean | null;
};

const BooleanCell = ({ value }: BooleanCellProps) =>
  value ? (
    <Check className="size-4 text-green-600" />
  ) : (
    <Minus className="size-4 text-muted-foreground" />
  );

export const PickStatisticsTable = ({ statistics }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Year</TableHead>
          <TableHead className="text-right">Month</TableHead>
          <TableHead className="text-right">Picks</TableHead>
          <TableHead className="text-right">Qty. Picked / Fetched</TableHead>
          <TableHead>U.</TableHead>
          <TableHead className="text-right">Kg. Picked</TableHead>
          <TableHead className="text-right">Avg. Qty. per pick</TableHead>
          <TableHead className="text-right">Avg. Kg. per pick</TableHead>
          <TableHead className="text-center">Stock product</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {statistics.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={11}
              className="h-24 text-center text-muted-foreground"
            >
              No pick statistics found.
            </TableCell>
          </TableRow>
        ) : (
          statistics.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="font-medium">
                <Link
                  href={`/pick-statistics/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {row.productCode ?? `Row #${row.id}`}
                </Link>
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell className="text-right">{row.year}</TableCell>
              <TableCell className="text-right">{row.month}</TableCell>
              <TableCell className="text-right">{row.picks}</TableCell>
              <TableCell className="text-right">{row.quantityPicked}</TableCell>
              <TableCell>
                {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
              </TableCell>
              <TableCell className="text-right">{row.kgPicked}</TableCell>
              <TableCell className="text-right">
                {row.avgQtyPerPick.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {row.avgKgPerPick.toFixed(2)}
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex justify-center">
                  <BooleanCell value={row.stockProduct} />
                </span>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
