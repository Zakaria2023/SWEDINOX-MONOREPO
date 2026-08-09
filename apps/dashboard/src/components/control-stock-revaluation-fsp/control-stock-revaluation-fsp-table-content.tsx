"use client";

import { StockRevaluationFspRow } from "@/app/(dashboard)/control-stock-revaluation-fsp/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateValue, formatMoney, formatNumber } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: StockRevaluationFspRow[];
};

export const StockRevaluationFspTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="control-stock-revaluation-fsp-table"
          fileName="control-stock-revaluation-fsp"
          sheetName="Control: Revaluation of Stock due to FSP-changes"
        />
      </div>
      <Table id="control-stock-revaluation-fsp-table">
        <TableHeader>
          <TableRow>
            <TableHead>Product code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Starting date</TableHead>
            <TableHead className="text-right">Financial year</TableHead>
            <TableHead className="text-right">Financial period</TableHead>
            <TableHead>GLA# Revaluation</TableHead>
            <TableHead>GLA Revaluation Stock</TableHead>
            <TableHead className="text-right">Revaluation amount</TableHead>
            <TableHead className="text-right">Revenue group #</TableHead>
            <TableHead>Revenue group</TableHead>
            <TableHead>PriceU</TableHead>
            <TableHead className="text-right">Technical stock</TableHead>
            <TableHead className="text-right">Technical stock value</TableHead>
            <TableHead>StkU</TableHead>
            <TableHead className="text-right">FSP</TableHead>
            <TableHead className="text-right">FSP −/− Preceding FSP</TableHead>
            <TableHead className="text-right">Preceding FSP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={17}
                className="h-24 text-center text-muted-foreground"
              >
                No stock revaluations from FSP changes.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-medium">{row.productCode}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.startingDate)}
                </TableCell>
                <TableCell className="text-right">
                  {row.financialYear ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.financialPeriod ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  —
                </TableCell>
                <TableCell className="text-right">
                  {row.revenueGroupNumber ?? "—"}
                </TableCell>
                <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
                <TableCell>{row.priceUnit ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.technicalStock)}
                </TableCell>
                <TableCell className="text-right">
                  {formatMoney(row.technicalStockValue)}
                </TableCell>
                <TableCell>{row.stockUnit ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {formatMoney(Number(row.fsp ?? 0))}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  —
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  —
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
