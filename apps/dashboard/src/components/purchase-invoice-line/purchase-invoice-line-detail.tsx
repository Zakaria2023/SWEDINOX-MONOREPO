import Link from "next/link";
import { PurchaseInvoiceLineDetail } from "@/app/(dashboard)/purchase-invoice-line/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatMoney,
  formatNumber,
} from "@/lib/helpers";

type Props = {
  line: PurchaseInvoiceLineDetail;
};

export const PurchaseInvoiceLineDetailView = ({ line }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Purchase invoice
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Invoice
          </p>
          {line.invoiceId === null ? (
            <p className="text-sm">—</p>
          ) : (
            <Link
              href={`/purchase-invoices/${line.purchaseInvoiceUuid}`}
              className="text-sm text-primary hover:underline"
            >
              #{line.invoiceId}
            </Link>
          )}
        </div>
        <DetailField
          label="Invoice date"
          value={formatDateColumn(line.invoiceDate)}
        />
        <DetailField
          label="Purchase order"
          value={
            line.purchaseOrderId === null
              ? line.purchaseOrderNumber
              : `${line.purchaseOrderId} / line ${line.lineNumber ?? "—"}`
          }
        />
        <DetailField
          label="Status"
          value={line.cancelled ? "Cancelled invoice" : "Booked"}
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Supplier
          </p>
          {line.supplierUuid && line.supplierName ? (
            <Link
              href={`/companies/${line.supplierUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {line.supplierName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Country" value={line.country} />
        <DetailField label="VAT number" value={line.vatNumber} />
        <DetailField label="Created" value={formatDateValue(line.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(line.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Line</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Product
          </p>
          {line.productCode ? (
            <Link
              href={`/products/${line.productUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {[line.productCode, line.productName]
                .filter(Boolean)
                .join(" — ")}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="CBS no." value={line.commodityCode} />
        <DetailField label="Quantity" value={line.quantity} />
        <DetailField label="Weight (kg)" value={formatNumber(line.weightKg)} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Stock lot
          </p>
          {line.stockUuid ? (
            <Link
              href={`/stock/${line.stockUuid}`}
              className="text-sm text-primary hover:underline"
            >
              View lot
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Lot valuation price"
          value={
            line.valuationPrice === null
              ? null
              : formatMoney(Number(line.valuationPrice))
          }
        />
        <DetailField label="Net price" value={line.netPrice} />
        <DetailField
          label="Invoiced amount"
          value={formatMoney(Number(line.amount ?? 0))}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        The invoiced amount is what this line was booked at, kept as a snapshot
        so a later revaluation of the stock lot does not change it. The weight
        is the purchase line&rsquo;s weight for the quantity invoiced.
      </p>
    </section>
  </div>
);
