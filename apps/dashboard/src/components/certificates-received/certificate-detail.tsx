import Link from "next/link";
import { CertificateDetail } from "@/app/(dashboard)/certificates-received/actions";
import { DetailField } from "@/components/ui/detail-field";
import { DocumentCell } from "@/components/ui/document-cell";
import { formatDateColumn, formatDateValue, yesNo } from "@/lib/helpers";
import { CERTIFICAAT_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";

type Props = {
  certificate: CertificateDetail;
};

export const CertificateDetailView = ({ certificate }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Certificate</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Certificate"
          value={
            certificate.documentCertificate
              ? CERTIFICAAT_LABELS[certificate.documentCertificate]
              : null
          }
        />
        <DetailField label="Document code" value={certificate.documentCode} />
        <DetailField label="File name" value={certificate.fileName} />
        <DetailField
          label="Received"
          value={
            certificate.receivedDate
              ? formatDateColumn(certificate.receivedDate)
              : "Not received yet"
          }
        />
        <DetailField
          label="Mandatory, ignore document"
          value={yesNo(certificate.mandatoryIgnoreDocument)}
        />
        <DetailField
          label="Producer"
          value={certificate.producer ?? certificate.producerOnBatch}
        />
        <DetailField
          label="Bill of lading"
          value={certificate.billOfLading}
        />
        <DetailField
          label="Created"
          value={formatDateValue(certificate.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(certificate.updatedAt)}
        />
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Documents
        </p>
        <DocumentCell documents={certificate.documents} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Batch and shipment
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Batch
          </p>
          <Link
            href={`/batches/${certificate.batchUuid}`}
            className="text-sm text-primary hover:underline"
          >
            {certificate.internalCharge ?? `Batch #${certificate.batchId ?? "?"}`}
          </Link>
        </div>
        <DetailField label="Mill charge" value={certificate.charge} />
        <DetailField label="Sheet number" value={certificate.sheetNumber} />
        <DetailField
          label="Receipt date"
          value={formatDateColumn(certificate.receiptDate)}
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Purchase order
          </p>
          {certificate.purchaseOrderUuid &&
          certificate.purchaseOrderId !== null ? (
            <Link
              href={`/purchase-orders/${certificate.purchaseOrderUuid}`}
              className="text-sm text-primary hover:underline"
            >
              #{certificate.purchaseOrderId}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Purchase line number"
          value={certificate.purchaseLineNumber}
        />
        <DetailField
          label="Line reference"
          value={certificate.lineReference}
        />
        <DetailField label="Supplier" value={certificate.supplierName} />
        <DetailField label="Supplier code" value={certificate.supplierCode} />
        <DetailField
          label="Product"
          value={
            [certificate.productCode, certificate.productName]
              .filter(Boolean)
              .join(" — ") || null
          }
        />
        <DetailField
          label="Stock category"
          value={certificate.stockCategory}
        />
        <DetailField label="Quality code" value={certificate.qualityCode} />
        <DetailField label="Options" value={certificate.options} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Quantity certified
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Quantity"
          value={`${certificate.qty ?? "0"} ${
            certificate.unit ? STOCK_UNIT_LABELS[certificate.unit] : ""
          }`.trim()}
        />
        <DetailField label="Weight (kg)" value={certificate.kg} />
        <DetailField label="Length (mm)" value={certificate.lengthMm} />
        <DetailField label="Width (mm)" value={certificate.widthMm} />
        <DetailField
          label="Thickness (mm)"
          value={certificate.thicknessMm}
        />
      </div>
    </section>
  </div>
);
