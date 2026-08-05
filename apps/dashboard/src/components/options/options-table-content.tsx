"use client";

import { OptionRevenueRow } from "@/app/(dashboard)/options/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  formatMoney,
  formatNumber,
  formatPercent,
  profitMarginPercent,
} from "@/lib/helpers";
import { ORDER_LINE_STATUS_LABELS } from "@/lib/labels";

type Props = {
  rows: OptionRevenueRow[];
};

const COLUMN_COUNT = 10;

export const OptionsTable = ({ rows }: Props) => {
  const totals = rows.reduce(
    (accumulator, row) => ({
      weightKg: accumulator.weightKg + row.weightKg,
      revenue: accumulator.revenue + row.revenue,
      profit: accumulator.profit + row.profit,
    }),
    { weightKg: 0, revenue: 0, profit: 0 },
  );

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Option code</TableHead>
            <TableHead>Option</TableHead>
            <TableHead className="text-right">Revenue group code</TableHead>
            <TableHead>Revenue group</TableHead>
            <TableHead>Line status</TableHead>
            <TableHead className="text-right">Lines</TableHead>
            <TableHead className="text-right">Weight (kg)</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">Profit margin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMN_COUNT}
                className="h-24 text-center text-muted-foreground"
              >
                No option revenue found.
              </TableCell>
            </TableRow>
          ) : (
            <>
              {rows.map((row, index) => (
                <TableRow key={`${row.optionCode}-${row.lineStatus}-${index}`}>
                  <TableCell className="font-medium">
                    {row.optionCode}
                  </TableCell>
                  <TableCell>{row.optionName}</TableCell>
                  <TableCell className="text-right">
                    {row.revenueGroupNumber ?? "—"}
                  </TableCell>
                  <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
                  <TableCell>
                    {row.lineStatus
                      ? ORDER_LINE_STATUS_LABELS[row.lineStatus]
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">{row.lineCount}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(row.weightKg)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoney(row.revenue)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoney(row.profit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(row.profitMargin)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell colSpan={6}>Total</TableCell>
                <TableCell className="text-right">
                  {formatNumber(totals.weightKg)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(totals.revenue)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(totals.profit)}
                </TableCell>
                <TableCell className="text-right">
                  {formatPercent(
                    profitMarginPercent(totals.revenue, totals.profit),
                  )}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
