"use client";

import { RemarkPerCompanyRow } from "@/app/(dashboard)/remarks-per-company/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { SALES_REPRESENTATIVE_LABELS } from "@/lib/labels";

type Props = {
  rows: RemarkPerCompanyRow[];
};

export const RemarksPerCompanyTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Customer no.</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Representative</TableHead>
          <TableHead>Remarks</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="h-24 text-center text-muted-foreground"
            >
              No company remarks found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.companyUuid}>
              <TableCell className="text-right">{row.companyCode}</TableCell>
              <TableCell className="font-medium">{row.customer}</TableCell>
              <TableCell>{row.city ?? "—"}</TableCell>
              <TableCell>
                {row.representative
                  ? SALES_REPRESENTATIVE_LABELS[row.representative]
                  : "—"}
              </TableCell>
              <TableCell className="max-w-md whitespace-pre-wrap">
                {row.remarks}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
