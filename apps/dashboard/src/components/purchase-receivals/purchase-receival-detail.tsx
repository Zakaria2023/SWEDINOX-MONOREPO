import Link from "next/link";
import { PurchaseReceivalDetail } from "@/app/(dashboard)/purchase-receivals/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatMoney,
} from "@/lib/helpers";
import { ORDER_LINE_STATUS_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";

type Props = {
  receival: PurchaseReceivalDetail;
};

export const PurchaseReceivalDetailView = ({ receival }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Receipt</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Receipt date"
          value={formatDateColumn(receival.receiptDate)}
        />
        <DetailField
          label="Receipt status"
          value={receival.receiptStatus}
        />
        <DetailField
          label="Line status"
          value={
            receival.lineStatus
              ? ORDER_LINE_STATUS_LABELS[receival.lineStatus]
              : null
          }
        />
        <DetailField label="Purchaser" value={receival.purchaser} />
        <DetailField label="Initials" value={receival.initials} />
        <DetailField
          label="Delivery date planned"
          value={formatDateColumn(receival.deliveryDatePlanned)}
        />
        <DetailField
          label="Delivery date actual"
          value={formatDateColumn(receival.deliveryDateActual)}
        />
        <DetailField
          label="Created"
          value={formatDateValue(receival.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(receival.updatedAt)}
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
          {receival.purchaseOrderUuid && receival.purchaseOrderId !== null ? (
            <Link
              href={`/purchase-orders/${receival.purchaseOrderUuid}`}
              className="text-sm text-primary hover:underline"
            >
              #{receival.purchaseOrderId}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Purchase order code"
          value={receival.purchaseOrderCode}
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Purchase line
          </p>
          {receival.purchaseOrderItemUuid ? (
            <Link
              href={`/purchase-lines/${receival.purchaseOrderItemUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {receival.lineNumber === null
                ? "View line"
                : `Line ${receival.lineNumber}`}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Supplier
          </p>
          {receival.companyUuid && receival.supplierName ? (
            <Link
              href={`/companies/${receival.companyUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {receival.supplierName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Supplier code" value={receival.supplierCode} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Product
          </p>
          {receival.productUuid && receival.productCode ? (
            <Link
              href={`/products/${receival.productUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {[receival.productCode, receival.productName]
                .filter(Boolean)
                .join(" — ")}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Options" value={receival.options} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Quantities received
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Received quantity"
          value={`${receival.receivedQty ?? "0"} ${
            receival.unit ? STOCK_UNIT_LABELS[receival.unit] : ""
          }`.trim()}
        />
        <DetailField label="Quantity planned" value={receival.qtyPlanned} />
        <DetailField label="Quantity actual" value={receival.qtyActual} />
        <DetailField label="Price quantity" value={receival.priceQuantity} />
        <DetailField label="Kg planned" value={receival.kgPlanned} />
        <DetailField label="Kg actual" value={receival.kgActual} />
        <DetailField label="Length (mm)" value={receival.lengthMm} />
        <DetailField
          label="Line amount"
          value={formatMoney(Number(receival.lineAmount ?? 0))}
        />
        <DetailField
          label="Invoiced price"
          value={formatMoney(Number(receival.invoicedPrice ?? 0))}
        />
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">
        Batch registered
      </h2>
      {receival.batch ? (
        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Batch
            </p>
            <Link
              href={`/batches/${receival.batch.uuid}`}
              className="text-sm text-primary hover:underline"
            >
              {receival.batch.internalCharge ?? "View batch"}
            </Link>
          </div>
          <DetailField label="Mill charge" value={receival.batch.charge} />
          <DetailField
            label="Receipt date"
            value={formatDateColumn(receival.batch.receiptDate)}
          />
          {receival.batch.stockUuid && (
            <div>
              <Link
                href={`/stock/${receival.batch.stockUuid}`}
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                View stock lot →
              </Link>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No batch has been registered for this receipt yet — batches are
          registered from the Batches overview.
        </p>
      )}
    </section>
  </div>
);
