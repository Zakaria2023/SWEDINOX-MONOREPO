import Link from "next/link";
import { PurchaseReceivalDetail } from "@/app/(dashboard)/purchase-receivals/actions";
import { PurchaseReceivalSplit } from "@/components/purchase-receivals/purchase-receival-split";
import { DetailField } from "@/components/ui/detail-field";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatDateColumn,
  formatDateValue,
  formatLengthMm,
  formatMoney,
  formatNumber,
} from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  RECEIPT_STATUS_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

type Props = {
  receival: PurchaseReceivalDetail;
};

export const PurchaseReceivalDetailView = ({ receival }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Receipt</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Receipt status
          </p>
          <StatusBadge
            value={receival.receiptStatus}
            label={
              receival.receiptStatus
                ? RECEIPT_STATUS_LABELS[receival.receiptStatus]
                : null
            }
          />
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Line status
          </p>
          <StatusBadge
            value={receival.lineStatus}
            label={
              receival.lineStatus
                ? ORDER_LINE_STATUS_LABELS[receival.lineStatus]
                : null
            }
          />
        </div>
        <DetailField
          label="Receipt date"
          value={formatDateColumn(receival.receiptDate)}
        />
        <DetailField
          label="Delivery date (p)"
          value={formatDateColumn(receival.deliveryDatePlanned)}
        />
        <DetailField
          label="Delivery date (a)"
          value={formatDateColumn(receival.deliveryDateActual)}
        />
        <DetailField
          label="Pre-announced delivery"
          value={formatDateColumn(receival.preAnnouncedDeliveryDate)}
        />
        <DetailField label="Purchaser" value={receival.purchaser} />
        <DetailField label="Initials" value={receival.purchaserInitials} />
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
              {receival.purchaseOrderCode ?? `#${receival.purchaseOrderId}`}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Purchase order date"
          value={formatDateColumn(receival.purchaseOrderDate)}
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
        <DetailField
          label="Length"
          value={formatLengthMm(receival.lengthMm)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Planned against actual
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Kg(p) — this instalment"
          value={formatNumber(Number(receival.kgPlanned ?? 0))}
        />
        <DetailField
          label="Kg(a) — this instalment"
          value={formatNumber(Number(receival.kgActual ?? 0))}
        />
        <DetailField
          label="Qty(p) — the line"
          value={`${formatNumber(Number(receival.qtyPlanned ?? 0))} ${
            receival.unit ? STOCK_UNIT_LABELS[receival.unit] : ""
          }`.trim()}
        />
        <DetailField
          label="Qty(a) — the line"
          value={formatNumber(Number(receival.qtyActual ?? 0))}
        />
        <DetailField
          label="Received Qty (confirmed)"
          value={formatNumber(Number(receival.confirmedQty ?? 0))}
        />
        <DetailField
          label="Price quantity"
          value={formatNumber(receival.priceQuantity)}
        />
        <DetailField
          label="Invoiced (Prod.)"
          value={formatNumber(receival.priceQuantity)}
        />
        <DetailField
          label="Line amount"
          value={formatMoney(receival.lineAmount)}
        />
      </div>
    </section>

    {receival.siblings.length > 1 && (
      <section className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">
          The line&apos;s instalments
        </h2>
        <div className="space-y-2">
          {receival.siblings.map((sibling, index) => (
            <div
              key={sibling.uuid}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
            >
              <span className="font-medium">
                {sibling.uuid === receival.uuid ? (
                  `Instalment ${index + 1} — this one`
                ) : (
                  <Link
                    href={`/purchase-receivals/${sibling.uuid}`}
                    className="text-primary hover:underline"
                  >
                    Instalment {index + 1}
                  </Link>
                )}
              </span>
              <span className="text-muted-foreground">
                {formatNumber(Number(sibling.kgPlanned ?? 0))} kg planned ·{" "}
                {formatNumber(Number(sibling.kgActual ?? 0))} kg arrived
              </span>
              <span className="text-muted-foreground">
                {formatDateColumn(
                  sibling.deliveryDateActual ?? sibling.deliveryDatePlanned,
                )}
              </span>
              <StatusBadge
                value={sibling.receiptStatus}
                label={
                  sibling.receiptStatus
                    ? RECEIPT_STATUS_LABELS[sibling.receiptStatus]
                    : null
                }
              />
            </div>
          ))}
        </div>
      </section>
    )}

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">Split</h2>
      <PurchaseReceivalSplit
        receivalUuid={receival.uuid}
        plannedKg={Number(receival.kgPlanned ?? 0)}
        arrivedKg={Number(receival.kgActual ?? 0)}
      />
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
