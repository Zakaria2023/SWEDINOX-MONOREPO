"use client";

import { PurchaseResultRow } from "@/app/(dashboard)/purchase-results/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatMoney } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: PurchaseResultRow[];
};

export const PurchaseResultsTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="purchase-results-table"
          fileName="purchase-results"
          sheetName="Purchase results"
        />
      </div>
      <Table id="purchase-results-table">
        <TableHeader>
          <TableRow>
            <TableHead>Main group</TableHead>
            <TableHead>Product code</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Year</TableHead>
            <TableHead className="text-right">Month</TableHead>
            <TableHead className="text-right">Purchase value</TableHead>
            <TableHead className="text-right">Replacement value</TableHead>
            <TableHead className="text-right">
              Purchase -/- replacement (€)
            </TableHead>
            <TableHead className="text-right">
              Purchase -/- replacement (%)
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="h-24 text-center text-muted-foreground"
              >
                No purchase results found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.mainGroup ?? "—"}</TableCell>
                <TableCell className="font-medium">
                  {row.productCode ?? "—"}
                </TableCell>
                <TableCell>{row.productName ?? "—"}</TableCell>
                <TableCell className="text-right">{row.year ?? "—"}</TableCell>
                <TableCell className="text-right">{row.month ?? "—"}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.purchaseValue)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.replacementValue)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.differenceEuro)}
                </TableCell>
                <TableCell className="text-right">
                  {row.differencePercent.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
