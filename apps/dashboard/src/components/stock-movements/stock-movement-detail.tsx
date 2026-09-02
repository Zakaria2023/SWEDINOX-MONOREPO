import Link from "next/link";
import { StockMovementDetail } from "@/app/(dashboard)/stock-movements/actions";
import {
  STOCK_MOVEMENT_REASON_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
  STOCK_STATUS_LABELS,
} from "@/lib/labels";

type Props = {
  movement: StockMovementDetail;
};

export const StockMovementDetailView = ({ movement }: Props) => {
  const source = movement.purchaseOrderId
    ? {
        label: `Purchase Order #${movement.purchaseOrderId}`,
        href: `/purchase-orders/${movement.purchaseOrderUuid}`,
      }
    : movement.purchaseInvoiceId
      ? {
          label: `Purchase Invoice #${movement.purchaseInvoiceId}`,
          href: `/purchase-invoices/${movement.purchaseInvoiceUuid}`,
        }
      : movement.orderId
        ? {
            label: `Order #${movement.orderId}`,
            href: `/orders/${movement.orderUuid}`,
          }
        : movement.invoiceId
          ? {
              label: `Invoice #${movement.invoiceId}`,
              href: `/invoices/${movement.invoiceUuid}`,
            }
          : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Type
          </p>
          <p className="text-sm">
            <span
              className={
                movement.type === "in"
                  ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                  : "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
              }
            >
              {STOCK_MOVEMENT_TYPE_LABELS[movement.type]}
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Reason
          </p>
          <p className="text-sm">
            {STOCK_MOVEMENT_REASON_LABELS[movement.reason]}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Quantity
          </p>
          <p className="text-sm">{movement.quantity}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Product
          </p>
          <p className="text-sm">
            {[movement.productCode, movement.productName]
              .filter(Boolean)
              .join(" — ") || "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Source
          </p>
          <p className="text-sm">
            {source ? (
              <Link
                href={source.href}
                className="font-medium underline-offset-4 hover:underline"
              >
                {source.label}
              </Link>
            ) : (
              "—"
            )}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Time
          </p>
          <p className="text-sm">
            {new Date(movement.createdAt).toLocaleString("en-GB")}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Note
          </p>
          <p className="text-sm">{movement.note ?? "—"}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">Stock Lot</h2>
        {movement.stock ? (
          <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Status
              </p>
              <p className="text-sm">
                {STOCK_STATUS_LABELS[movement.stock.status]}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Remaining
              </p>
              <p className="text-sm">{movement.stock.quantity}</p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Reserved
              </p>
              <p className="text-sm">{movement.stock.reservedQuantity}</p>
            </div>
            <div>
              <Link
                href={`/stock/${movement.stock.uuid}`}
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                View lot →
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            The stock lot for this movement could not be found.
          </p>
        )}
      </div>
    </div>
  );
};
