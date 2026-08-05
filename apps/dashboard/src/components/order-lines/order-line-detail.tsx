import Link from "next/link";
import { OrderLineDetail } from "@/app/(dashboard)/order-lines/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatMoney,
  formatNumber,
  formatPercent,
  yesNo,
} from "@/lib/helpers";
import {
  DELIVERY_STATUS_LABELS,
  ORDER_ITEM_STATUS_LABELS,
  ORDER_LINE_STATUS_LABELS,
  STOCK_STATUS_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

type Props = {
  line: OrderLineDetail;
};

export const OrderLineDetailView = ({ line }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Line</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Order
          </p>
          {line.orderId === null ? (
            <p className="text-sm">—</p>
          ) : (
            <Link
              href={`/orders/${line.orderUuid}`}
              className="text-sm text-primary hover:underline"
            >
              #{line.orderId}
            </Link>
          )}
        </div>
        <DetailField label="Line number" value={line.lineNumber} />
        <DetailField label="Line type" value={line.lineType} />
        <DetailField
          label="Status"
          value={ORDER_ITEM_STATUS_LABELS[line.status]}
        />
        <DetailField
          label="Line status"
          value={
            line.lineStatus ? ORDER_LINE_STATUS_LABELS[line.lineStatus] : null
          }
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Customer
          </p>
          {line.companyUuid && line.customerName ? (
            <Link
              href={`/companies/${line.companyUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {line.customerName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Customer reference" value={line.customerRef} />
        <DetailField label="Order category" value={line.orderCategory} />
        <DetailField label="Seller" value={line.seller} />
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
        <DetailField label="Options" value={line.options} />
        <DetailField label="Created" value={formatDateValue(line.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(line.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Fulfilment and delivery
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Delivery status"
          value={
            line.deliveryStatus
              ? DELIVERY_STATUS_LABELS[line.deliveryStatus]
              : null
          }
        />
        <DetailField
          label="Delivery date"
          value={formatDateColumn(line.deliveryDate)}
        />
        <DetailField
          label="Reservation date"
          value={formatDateColumn(line.reservationDate)}
        />
        <DetailField label="Pickup" value={yesNo(line.isPickup)} />
        <DetailField
          label="Last warehouse work order"
          value={line.lastWarehouseWorkOrder}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Blocks</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Commercial block"
          value={yesNo(line.commercialBlock)}
        />
        <DetailField
          label="Financial block"
          value={yesNo(line.financialBlock)}
        />
        <DetailField
          label="Transport block"
          value={yesNo(line.transportBlock)}
        />
      </div>
      <DetailField label="Blocking reason" value={line.blockingReason} />
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Quantities and dimensions
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Reserved quantity"
          value={`${line.quantity} ${
            line.unit ? STOCK_UNIT_LABELS[line.unit] : ""
          }`.trim()}
        />
        <DetailField label="Invoiced quantity" value={line.invoicedQuantity} />
        <DetailField
          label="Remaining to invoice"
          value={formatNumber(line.remainingToInvoice)}
        />
        <DetailField label="Length (mm)" value={line.lengthMm} />
        <DetailField label="Width (mm)" value={line.widthMm} />
        <DetailField label="Thickness (mm)" value={line.thicknessMm} />
        <DetailField label="Quantity planned" value={line.qtyPlanned} />
        <DetailField label="Quantity actual" value={line.qtyActual} />
        <DetailField label="Quantity call-off" value={line.qtyCallOff} />
        <DetailField label="Quantity reserved" value={line.qtyReserved} />
        <DetailField label="Kg planned" value={line.kgPlanned} />
        <DetailField label="Kg actual" value={line.kgActual} />
        <DetailField label="Kg call-off" value={line.kgCallOff} />
        <DetailField label="Kg reserved" value={line.kgReserved} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Purchase link</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Purchase order
          </p>
          {line.purchaseOrderUuid && line.purchaseOrderId !== null ? (
            <Link
              href={`/purchase-orders/${line.purchaseOrderUuid}`}
              className="text-sm text-primary hover:underline"
            >
              #{line.purchaseOrderId}
            </Link>
          ) : (
            <p className="text-sm">— (from stock)</p>
          )}
        </div>
        <DetailField label="Quantity purchased" value={line.qtyPurchased} />
        <DetailField label="Kg purchased" value={line.kgPurchased} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Pricing and margin
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Gross price"
          value={`${formatMoney(Number(line.grossPrice ?? 0))} ${
            line.priceUnit ?? ""
          }`.trim()}
        />
        <DetailField
          label="Line discount"
          value={formatPercent(Number(line.lineDiscount ?? 0))}
        />
        <DetailField
          label="Group discount"
          value={formatPercent(Number(line.groupDiscount ?? 0))}
        />
        <DetailField
          label="Net price"
          value={formatMoney(Number(line.netPrice ?? 0))}
        />
        <DetailField
          label="Amount"
          value={formatMoney(Number(line.amount ?? 0))}
        />
        <DetailField
          label="Cost price"
          value={formatMoney(Number(line.costPrice ?? 0))}
        />
        <DetailField
          label="Cost amount"
          value={formatMoney(Number(line.costAmount ?? 0))}
        />
        <DetailField
          label="Replacement price"
          value={formatMoney(Number(line.replacementPrice ?? 0))}
        />
        <DetailField
          label="Profit"
          value={formatMoney(Number(line.profit ?? 0))}
        />
        <DetailField
          label="Profit margin"
          value={formatPercent(Number(line.profitMargin ?? 0))}
        />
        <DetailField
          label="Profit at replacement price"
          value={formatMoney(Number(line.profitReplPrice ?? 0))}
        />
        <DetailField
          label="Profit below floor"
          value={yesNo(line.profitTooLow)}
        />
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">
        Allocated stock lot
      </h2>
      {line.stock ? (
        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
          <DetailField
            label="Status"
            value={STOCK_STATUS_LABELS[line.stock.status]}
          />
          <DetailField
            label="On hand"
            value={`${line.stock.quantity} ${
              line.stock.unit ? STOCK_UNIT_LABELS[line.stock.unit] : ""
            }`.trim()}
          />
          <DetailField label="Reserved" value={line.stock.reservedQuantity} />
          <DetailField
            label="Valuation price"
            value={formatMoney(Number(line.stock.valuationPrice ?? 0))}
          />
          <DetailField label="Mill charge" value={line.stock.charge} />
          <DetailField
            label="Internal charge"
            value={line.stock.internalCharge}
          />
          <div>
            <Link
              href={`/stock/${line.stock.uuid}`}
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              View lot →
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          The stock lot this line was allocated to could not be found.
        </p>
      )}
    </section>
  </div>
);
