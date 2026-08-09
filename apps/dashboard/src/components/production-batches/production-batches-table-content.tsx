"use client";

import Link from "next/link";
import { ProductionBatchListItem } from "@/app/(dashboard)/production-batches/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  batches: ProductionBatchListItem[];
};

export const ProductionBatchesTable = ({ batches }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="production-batches-table"
          fileName="production-batches"
          sheetName="Production batches"
        />
      </div>
      <Table id="production-batches-table">
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Machine</TableHead>
            <TableHead>To location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-24 text-center text-muted-foreground"
              >
                No production batches found.
              </TableCell>
            </TableRow>
          ) : (
            batches.map((row) => (
              <TableRow key={row.uuid}>
                <TableCell className="font-medium">
                  <Link
                    href={`/production-batches/${row.uuid}`}
                    className="text-primary hover:underline"
                  >
                    {row.code}
                  </Link>
                </TableCell>
                <TableCell>{row.createdOn ?? "—"}</TableCell>
                <TableCell>{row.machineName ?? "—"}</TableCell>
                <TableCell>{row.toLocationName ?? "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
