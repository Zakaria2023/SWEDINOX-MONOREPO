import Link from "next/link";
import { PurchaseLineDetail } from "@/app/(dashboard)/purchase-lines/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatMoney,
  remainingToInvoice,
} from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

type Props = {
  line: PurchaseLineDetail;
};

export const PurchaseLineDetailView = ({ line }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Purchase order</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Purchase order
          </p>
          {line.purchaseOrderId === null ? (
            <p className="text-sm">—</p>
          ) : (
            <Link
              href={`/purchase-orders/${line.purchaseOrderUuid}`}
              className="text-sm text-primary hover:underline"
            >
              #{line.purchaseOrderId}
            </Link>
          )}
        </div>
        <DetailField
          label="Order status"
          value={
            line.purchaseOrderStatus
              ? PURCHASE_ORDER_STATUS_LABELS[line.purchaseOrderStatus]
              : null
          }
        />
        <DetailField
          label="Order reference"
          value={line.purchaseOrderReference}
        />
        <DetailField
          label="Order date"
          value={formatDateColumn(line.orderDate)}
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
        <DetailField label="Purchaser" value={line.purchaser} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Line</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Line number" value={line.lineNumber} />
        <DetailField
          label="Status"
          value={line.status ? ORDER_LINE_STATUS_LABELS[line.status] : null}
        />
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
        <DetailField label="Quality code" value={line.qualityCode} />
        <DetailField label="Stock category" value={line.stockCategory} />
        <DetailField label="Options" value={line.options} />
        <DetailField
          label="Receipt date"
          value={formatDateColumn(line.receiptDate)}
        />
        <DetailField label="Created" value={formatDateValue(line.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(line.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Quantities and dimensions
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Ordered quantity"
          value={`${line.quantity} ${
            line.unit ? STOCK_UNIT_LABELS[line.unit] : ""
          }`.trim()}
        />
        <DetailField label="Quantity planned" value={line.qtyPlanned} />
        <DetailField label="Quantity received" value={line.qtyReceived} />
        <DetailField
          label="Still to receive"
          value={remainingToInvoice(line.quantity, line.qtyReceived)}
        />
        <DetailField label="Reserved quantity" value={line.reservedQty} />
        <DetailField label="Kg purchased" value={line.kgPurchased} />
        <DetailField label="Length (mm)" value={line.lengthMm} />
        <DetailField label="Width (mm)" value={line.widthMm} />
        <DetailField label="Thickness (mm)" value={line.thicknessMm} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Price</h2>
      <p className="text-sm text-muted-foreground">
        A received lot is valued at this net price, which is what makes a sales
        line&rsquo;s cost — and its margin — a true figure.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Net price"
          value={`${line.netPrice ?? "0"} ${line.priceUnit ?? ""}`.trim()}
        />
        <DetailField
          label="Amount"
          value={formatMoney(Number(line.amount ?? 0))}
        />
      </div>
    </section>
  </div>
);
