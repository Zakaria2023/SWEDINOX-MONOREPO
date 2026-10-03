"use client";

import { Paged } from "@/lib/table-query";

import { TablePagination } from "@/components/ui/table-pagination";
import { OptionRevenueRow } from "@/app/(dashboard)/options/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatMoney,
  formatNumber,
  formatPercent,
  profitMarginPercent,
} from "@/lib/helpers";
import { ORDER_LINE_STATUS_LABELS } from "@/lib/labels";
import { TableExportButton } from "@/components/ui/table-export-button";
import { GenerateOptionChargesButton } from "@/components/options/generate-option-charges-button";

type Props = {
  page: Paged<OptionRevenueRow>;
};

const COLUMN_COUNT = 10;

export const OptionsTable = ({ page }: Props) => {
  // Totals for the rows on this page, not for the whole list -- the footer
  // says so, because before paging the two were the same number.
  const totals = page.rows.reduce(
    (accumulator, row) => ({
      weightKg: accumulator.weightKg + row.weightKg,
      revenue: accumulator.revenue + row.revenue,
      profit: accumulator.profit + row.profit,
    }),
    { weightKg: 0, revenue: 0, profit: 0 },
  );

  return (
    <div>
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <TableExportButton
            tableId="options-table"
            fileName="options"
            sheetName="Options"
          />
          <GenerateOptionChargesButton />
        </div>
        <Table id="options-table">
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
            {page.rows.length === 0 ? (
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
                {page.rows.map((row, index) => (
                  <TableRow
                    key={`${row.optionCode}-${row.lineStatus}-${index}`}
                  >
                    <TableCell className="font-medium">
                      {row.optionCode}
                    </TableCell>
                    <TableCell>{row.optionName}</TableCell>
                    <TableCell className="text-right">
                      {row.revenueGroupNumber ?? "—"}
                    </TableCell>
                    <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge
                        value={row.lineStatus}
                        label={
                          row.lineStatus
                            ? ORDER_LINE_STATUS_LABELS[row.lineStatus]
                            : null
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {row.lineCount}
                    </TableCell>
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
      <TablePagination page={page} singular="option" plural="options" />
    </div>
  );
};
