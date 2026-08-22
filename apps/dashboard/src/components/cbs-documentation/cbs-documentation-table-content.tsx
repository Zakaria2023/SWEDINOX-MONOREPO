"use client";

import { CbsDocumentationRow } from "@/app/(dashboard)/cbs-documentation/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  formatDateValue,
  formatMoney,
  formatNumber,
  yesNo,
} from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: CbsDocumentationRow[];
};

export const CbsDocumentationTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="cbs-documentation-table"
          fileName="cbs-documentation"
          sheetName="CBS Documentation"
        />
      </div>
      <Table id="cbs-documentation-table">
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Invoice Nr</TableHead>
            <TableHead>Rubric</TableHead>
            <TableHead>Intrastatcode</TableHead>
            <TableHead className="text-right">Invoice amount</TableHead>
            <TableHead className="text-right">Weight (kg&apos;s)</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Origin</TableHead>
            <TableHead>Container</TableHead>
            <TableHead>Ordertype</TableHead>
            <TableHead className="text-right">Ordercode</TableHead>
            <TableHead className="text-right">Orderline nr</TableHead>
            <TableHead>Stat</TableHead>
            <TableHead>Transactioncode</TableHead>
            <TableHead>Partner Id</TableHead>
            <TableHead className="text-right">Transportcode</TableHead>
            <TableHead>Intra-community</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={17}
                className="h-24 text-center text-muted-foreground"
              >
                No CBS documentation entries found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.invoiceDate)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {row.invoiceId}
                </TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="text-right">
                  {formatMoney(Number(row.invoiceAmount ?? 0))}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(Number(row.weightKg ?? 0))}
                </TableCell>
                <TableCell>{row.companyName ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell>{row.orderType ?? "—"}</TableCell>
                <TableCell className="text-right">{row.orderCode}</TableCell>
                <TableCell className="text-right">
                  {row.orderLineNr ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell>{row.partnerId ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.transportCode ?? "—"}
                </TableCell>
                <TableCell>
                  {row.intraCommunity === null
                    ? "—"
                    : yesNo(row.intraCommunity)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
