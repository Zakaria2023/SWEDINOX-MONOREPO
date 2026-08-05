import Link from "next/link";
import { BatchDetail } from "@/app/(dashboard)/batches/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { DetailField } from "@/components/ui/detail-field";
import { DocumentCell } from "@/components/ui/document-cell";
import {
  formatDateColumn,
  formatDateValue,
  orDash,
  yesNo,
} from "@/lib/helpers";
import {
  CERTIFICAAT_LABELS,
  STOCK_STATUS_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

type Props = {
  batch: BatchDetail;
};

export const BatchDetailView = ({ batch }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Traceability</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Internal charge" value={batch.internalCharge} />
        <DetailField label="Mill charge" value={batch.charge} />
        <DetailField label="Sheet number" value={batch.sheetNumber} />
        <DetailField label="Producer" value={batch.producer} />
        <DetailField label="Stock category" value={batch.stockCategory} />
        <DetailField label="Quality code" value={batch.qualityCode} />
        <DetailField label="Options" value={batch.options} />
        <DetailField
          label="Receipt date"
          value={formatDateColumn(batch.receiptDate)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Origin</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Purchase order
          </p>
          {batch.purchaseOrderUuid && batch.purchaseOrderId !== null ? (
            <Link
              href={`/purchase-orders/${batch.purchaseOrderUuid}`}
              className="text-sm text-primary hover:underline"
            >
              #{batch.purchaseOrderId}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Purchase order code"
          value={batch.purchaseOrderCode}
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Supplier
          </p>
          {batch.supplierUuid && batch.supplierName ? (
            <Link
              href={`/companies/${batch.supplierUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {batch.supplierName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Supplier code" value={batch.supplierCode} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Product
          </p>
          {batch.productUuid && batch.productCode ? (
            <Link
              href={`/products/${batch.productUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {[batch.productCode, batch.productName]
                .filter(Boolean)
                .join(" — ")}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Created" value={formatDateValue(batch.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(batch.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Quantity and dimensions
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Quantity"
          value={`${batch.qty ?? "0"} ${
            batch.unit ? STOCK_UNIT_LABELS[batch.unit] : ""
          }`.trim()}
        />
        <DetailField label="Weight (kg)" value={batch.kg} />
        <DetailField label="Length (mm)" value={batch.lengthMm} />
        <DetailField label="Width (mm)" value={batch.widthMm} />
        <DetailField label="Thickness (mm)" value={batch.thicknessMm} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Certificate on the batch
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Certificate"
          value={
            batch.documentCertificate
              ? CERTIFICAAT_LABELS[batch.documentCertificate]
              : null
          }
        />
        <DetailField label="Document code" value={batch.documentCode} />
        <DetailField label="File name" value={batch.fileName} />
        <DetailField
          label="Mandatory, ignore document"
          value={yesNo(batch.mandatoryIgnoreDocument)}
        />
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">
        Certificates received
      </h2>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Certificate</TableHead>
              <TableHead>Document code</TableHead>
              <TableHead>Bill of lading</TableHead>
              <TableHead>Producer</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Ignore document</TableHead>
              <TableHead>Files</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batch.certificates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No certificate has been registered for this batch.
                </TableCell>
              </TableRow>
            ) : (
              batch.certificates.map((row) => (
                <TableRow key={row.uuid}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/certificates-received/${row.uuid}`}
                      className="text-primary hover:underline"
                    >
                      {row.documentCertificate
                        ? CERTIFICAAT_LABELS[row.documentCertificate]
                        : "Certificate"}
                    </Link>
                  </TableCell>
                  <TableCell>{orDash(row.documentCode)}</TableCell>
                  <TableCell>{orDash(row.billOfLading)}</TableCell>
                  <TableCell>{orDash(row.producer)}</TableCell>
                  <TableCell>
                    {row.receivedDate
                      ? formatDateColumn(row.receivedDate)
                      : "Not received"}
                  </TableCell>
                  <TableCell>{yesNo(row.mandatoryIgnoreDocument)}</TableCell>
                  <TableCell>
                    <DocumentCell documents={row.documents} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">Stock lot</h2>
      {batch.stock ? (
        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
          <DetailField
            label="Status"
            value={STOCK_STATUS_LABELS[batch.stock.status]}
          />
          <DetailField
            label="On hand"
            value={`${batch.stock.quantity} ${
              batch.stock.unit ? STOCK_UNIT_LABELS[batch.stock.unit] : ""
            }`.trim()}
          />
          <DetailField label="Reserved" value={batch.stock.reservedQuantity} />
          <div>
            <Link
              href={`/stock/${batch.stock.uuid}`}
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              View lot →
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This batch is not linked to a stock lot.
        </p>
      )}
    </section>
  </div>
);
