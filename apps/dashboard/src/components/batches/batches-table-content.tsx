"use client";

import Link from "next/link";
import { BatchRow } from "@/app/(dashboard)/batches/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { BooleanFlag } from "@/components/ui/boolean-flag";
import { formatDateValue, formatNumber } from "@/lib/helpers";
import { CERTIFICAAT_LABELS } from "@/lib/labels";

type Props = {
  rows: BatchRow[];
};

const COLUMN_COUNT = 23;

export const BatchesTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Purchase order</TableHead>
          <TableHead className="text-right">Supplier code</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Length</TableHead>
          <TableHead className="text-right">Width</TableHead>
          <TableHead className="text-right">Thickness</TableHead>
          <TableHead className="text-right">Qty(a)</TableHead>
          <TableHead>Qty U</TableHead>
          <TableHead className="text-right">Kg(a)</TableHead>
          <TableHead>Charge</TableHead>
          <TableHead>Internal charge</TableHead>
          <TableHead>Sheet number</TableHead>
          <TableHead>Document code</TableHead>
          <TableHead>Filename</TableHead>
          <TableHead>Mand. ign. doc.</TableHead>
          <TableHead>Receipt date</TableHead>
          <TableHead>Stock category</TableHead>
          <TableHead>Quality code</TableHead>
          <TableHead>Document certificate</TableHead>
          <TableHead>Producer</TableHead>
          <TableHead>Options</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={COLUMN_COUNT}
              className="h-24 text-center text-muted-foreground"
            >
              No batches found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="text-right">
                {row.purchaseOrderId ?? row.purchaseOrderCode ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.supplierCode ?? "—"}
              </TableCell>
              <TableCell>{row.supplierName ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.lengthMm ?? "—"}
              </TableCell>
              <TableCell className="text-right">{row.widthMm ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.thicknessMm ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(Number(row.qty ?? 0))}
              </TableCell>
              <TableCell>{row.unit?.toUpperCase() ?? "—"}</TableCell>
              <TableCell className="text-right">
                {formatNumber(Number(row.kg ?? 0))}
              </TableCell>
              <TableCell>{row.charge ?? "—"}</TableCell>
              <TableCell className="font-medium whitespace-nowrap">
                <Link
                  href={`/batches/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {row.internalCharge ?? `Batch #${row.id}`}
                </Link>
              </TableCell>
              <TableCell>{row.sheetNumber ?? "—"}</TableCell>
              <TableCell>{row.documentCode ?? "—"}</TableCell>
              <TableCell>{row.fileName ?? "—"}</TableCell>
              <TableCell>
                <BooleanFlag
                  on={row.mandatoryIgnoreDocument}
                  label="Mandatory, ignore document"
                />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.receiptDate)}
              </TableCell>
              <TableCell>{row.stockCategory ?? "—"}</TableCell>
              <TableCell>{row.qualityCode ?? "—"}</TableCell>
              <TableCell>
                {row.documentCertificate
                  ? CERTIFICAAT_LABELS[row.documentCertificate]
                  : "—"}
              </TableCell>
              <TableCell>{row.producer ?? "—"}</TableCell>
              <TableCell>{row.options ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
