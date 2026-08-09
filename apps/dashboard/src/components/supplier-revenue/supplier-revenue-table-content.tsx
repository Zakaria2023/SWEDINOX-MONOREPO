"use client";

import { SupplierRevenueRow } from "@/app/(dashboard)/supplier-revenue/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatMoney, formatNumber } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: SupplierRevenueRow[];
};

export const SupplierRevenueTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="supplier-revenue-table"
          fileName="supplier-revenue"
          sheetName="Supplier revenue"
        />
      </div>
      <Table id="supplier-revenue-table">
        <TableHeader>
          <TableRow>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right">Supplier code</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Country</TableHead>
            <TableHead className="text-right">Month</TableHead>
            <TableHead className="text-right">Year</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Weight (kg)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-24 text-center text-muted-foreground"
              >
                No supplier revenue found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {row.supplierName ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.supplierCode ?? "—"}
                </TableCell>
                <TableCell>{row.city ?? "—"}</TableCell>
                <TableCell>{row.country ?? "—"}</TableCell>
                <TableCell className="text-right">{row.month ?? "—"}</TableCell>
                <TableCell className="text-right">{row.year ?? "—"}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.revenue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.weightKg)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
