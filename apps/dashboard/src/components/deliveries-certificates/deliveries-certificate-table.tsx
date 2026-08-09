"use client";

import { DeliveryCertificateRow } from "@/app/(dashboard)/sending-certificates/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { DELIVERY_STATUS_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";
import { formatDateValue, formatNumber } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: DeliveryCertificateRow[];
  emptyMessage: string;
};

const Dash = () => <span className="text-muted-foreground">—</span>;

export const DeliveriesCertificateTable = ({ rows, emptyMessage }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="deliveries-from-missing-batch-table"
          fileName="deliveries-from-missing-batch"
          sheetName="Deliveries from the Missing Batch"
        />
      </div>
      <Table id="deliveries-from-missing-batch-table">
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">Sales order</TableHead>
            <TableHead className="text-right">Sales line</TableHead>
            <TableHead className="text-right">Customer code</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Customer ref.</TableHead>
            <TableHead>Product code</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Delivery date</TableHead>
            <TableHead>Bill of lading</TableHead>
            <TableHead className="text-right">Length</TableHead>
            <TableHead className="text-right">Width</TableHead>
            <TableHead className="text-right">Qty (a)</TableHead>
            <TableHead>Qty U</TableHead>
            <TableHead className="text-right">Kg (a)</TableHead>
            <TableHead>Internal reference</TableHead>
            <TableHead>Charge</TableHead>
            <TableHead>Internal charge</TableHead>
            <TableHead>Sheet number</TableHead>
            <TableHead>Purchase order</TableHead>
            <TableHead>Receipt date</TableHead>
            <TableHead>Document code</TableHead>
            <TableHead>Filename</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead>Sending to</TableHead>
            <TableHead>Document sent</TableHead>
            <TableHead>Mand. ign. doc.</TableHead>
            <TableHead>Delivery status</TableHead>
            <TableHead>Options</TableHead>
            <TableHead className="text-right">Thickness</TableHead>
            <TableHead>Stock Category</TableHead>
            <TableHead>Quality Code</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Use customer stock</TableHead>
            <TableHead>Document certificate</TableHead>
            <TableHead>Producer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={35}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="text-right font-medium">
                  {row.salesOrder}
                </TableCell>
                <TableCell className="text-right">
                  {row.salesLine ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.customerCode ?? "—"}
                </TableCell>
                <TableCell>{row.customerName ?? "—"}</TableCell>
                <TableCell>{row.customerRef ?? "—"}</TableCell>
                <TableCell>{row.productCode ?? "—"}</TableCell>
                <TableCell>{row.productName ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.deliveryDate)}
                </TableCell>
                <TableCell>{row.billOfLading ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.lengthMm ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.widthMm ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(Number(row.qtyActual ?? 0))}
                </TableCell>
                <TableCell>
                  {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(Number(row.kgActual ?? 0))}
                </TableCell>
                <TableCell>
                  <Dash />
                </TableCell>
                <TableCell>{row.charge ?? "—"}</TableCell>
                <TableCell>{row.internalCharge ?? "—"}</TableCell>
                <TableCell>{row.sheetNumber ?? "—"}</TableCell>
                <TableCell>{row.purchaseOrder ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.receiptDate)}
                </TableCell>
                <TableCell>{row.documentCode ?? "—"}</TableCell>
                <TableCell>{row.fileName ?? "—"}</TableCell>
                <TableCell>
                  <Dash />
                </TableCell>
                <TableCell>
                  <Dash />
                </TableCell>
                <TableCell>
                  <Dash />
                </TableCell>
                <TableCell>
                  {row.mandatoryIgnoreDocument === null
                    ? "—"
                    : row.mandatoryIgnoreDocument
                      ? "Yes"
                      : "No"}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    value={row.deliveryStatus}
                    label={
                      row.deliveryStatus
                        ? DELIVERY_STATUS_LABELS[row.deliveryStatus]
                        : null
                    }
                  />
                </TableCell>
                <TableCell>{row.options ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.thicknessMm ?? "—"}
                </TableCell>
                <TableCell>{row.stockCategory ?? "—"}</TableCell>
                <TableCell>{row.qualityCode ?? "—"}</TableCell>
                <TableCell>
                  <Dash />
                </TableCell>
                <TableCell>
                  <Dash />
                </TableCell>
                <TableCell>{row.documentCertificate ?? "—"}</TableCell>
                <TableCell>{row.producer ?? "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
